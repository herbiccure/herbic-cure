import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { createDelhiveryShipment, DelhiveryShipmentOrder, scheduleDailyDelhiveryPickup } from '@/lib/shipping/delhivery';
import { createAuditLogEntry } from '@/data/admin/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/orders/[id]/accept
 * Confirms order and dispatches directly to Delhivery Express (AWB generated).
 * Idempotent, audited, server-side validated.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const session = (authCheck && 'session' in authCheck) ? authCheck.session : null;
    const actorEmail = (session as any)?.email || (session as any)?.user?.email || 'admin@herbiccure.com';
    const actorId = (session as any)?.id || (session as any)?.user?.id || 'admin';
    const actorRole = (session as any)?.role || 'ADMIN';
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.orderStatus === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot accept a cancelled order.' },
        { status: 400 }
      );
    }

    // Idempotency: if already has active AWB
    if (order.trackingNumber && !order.trackingNumber.startsWith('DLH')) {
      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} is already confirmed with AWB ${order.trackingNumber}.`,
        order,
      });
    }

    // Parse address
    let destAddress = order.shippingAddress;
    let city = '';
    let state = '';
    let pincode = '';

    try {
      const trimmed = (order.shippingAddress || '').trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        destAddress = parsed.address || parsed.addressLine1 || order.shippingAddress;
        if (parsed.addressLine2) destAddress = `${destAddress}, ${parsed.addressLine2}`;
        city = parsed.city || '';
        state = parsed.state || '';
        pincode = (parsed.pinCode || parsed.pincode || '').replace(/\D/g, '');
      }
    } catch {}

    const isCod = order.paymentMethod === 'COD';
    const orderAdv = Number((order as any).advanceAmount ?? 0);
    const effectiveCodBalance = Number(
      (order as any).codBalanceAmount ?? (order.total - orderAdv)
    );

    const shipmentPayload: DelhiveryShipmentOrder = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: destAddress,
      city,
      state,
      pincode,
      totalAmount: order.total,
      shippingFee: order.shippingFee,
      codBalanceAmount: isCod ? effectiveCodBalance : 0,
      paymentMethod: isCod ? 'COD' : 'Prepaid',
      items: order.items.map((it: any) => ({
        name: it.productName,
        productName: it.productName,
        labelName: it.product?.labelName || null,
        sku: it.product?.sku || it.productId || 'HC-PROD',
        quantity: it.quantity,
        price: it.price,
        product: it.product,
      })),
    };

    const manifestRes = await createDelhiveryShipment(shipmentPayload);

    if (manifestRes.success && manifestRes.waybill) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          trackingNumber: manifestRes.waybill,
          trackingUrl: manifestRes.trackingUrl,
          carrier: 'Delhivery',
          delhiveryStatus: 'READY_TO_SHIP',
          orderStatus: 'READY_TO_SHIP',
          delhiverySyncStatus: 'SYNCED',
          delhiverySyncError: null,
          lastDelhiverySyncAt: new Date(),
        } as any,
        include: {
          items: true,
          events: { orderBy: { timestamp: 'desc' } },
        },
      });

      await prisma.shipmentEvent.create({
        data: {
          orderId: order.id,
          status: 'READY_TO_SHIP',
          location: 'Delhivery Logistics Hub',
          description: `Order confirmed by staff (${actorEmail}) and manifested with Delhivery. AWB: ${manifestRes.waybill}`,
        },
      });

      await createAuditLogEntry({
        actorId,
        actorEmail,
        actorRole,
        action: 'ORDER_ACCEPTED_AND_MANIFESTED',
        resource: 'Order',
        resourceId: order.id,
        diff: {
          orderNumber: order.orderNumber,
          waybill: manifestRes.waybill,
        },
        status: 'SUCCESS',
        request,
      });

      // Auto pickup check if configured
      try {
        const pickupSetting = await prisma.siteSetting.findUnique({ where: { key: 'pickup_mode' } });
        if (pickupSetting?.value === 'auto' || process.env.PICKUP_MODE === 'auto') {
          scheduleDailyDelhiveryPickup().catch(() => {});
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} accepted, confirmed & sent to Delhivery! AWB: ${manifestRes.waybill}`,
        order: updatedOrder,
      });
    } else {
      const errMsg = manifestRes.message || 'Manifestation rejected by Delhivery';
      await prisma.order.update({
        where: { id: order.id },
        data: {
          delhiverySyncStatus: 'FAILED',
          delhiverySyncError: errMsg,
          delhiverySyncAttempts: { increment: 1 },
          lastDelhiverySyncAt: new Date(),
        } as any,
      });

      return NextResponse.json(
        { error: errMsg, delhiveryStatus: 'FAILED' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error('admin.order.accept_fatal', { error: error?.message });
    return NextResponse.json(
      { error: error?.message || 'Failed to accept and manifest order' },
      { status: 500 }
    );
  }
}
