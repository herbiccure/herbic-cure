import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { createAuditLogEntry } from '@/data/admin/audit';
import { createDelhiveryShipment } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request, [
      'OWNER',
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'STORE_MANAGER',
      'SUPPORT',
    ]);
    if (authCheck instanceof NextResponse) return authCheck;

    const { session } = authCheck;
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.orderStatus === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot manifest a cancelled order' },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { force } = body;

    // Guard: In 'delhivery_pending' mode, manifestation is managed inside Delhivery One
    const { getEffectiveShippingMode } = await import('@/lib/shipping/delhiveryPending');
    const effectiveMode = await getEffectiveShippingMode();
    if (effectiveMode === 'delhivery_pending' && !force) {
      return NextResponse.json(
        {
          error:
            'Direct manifestation from Admin UI is disabled in Delhivery Pending mode. Staff must verify and manifest orders inside Delhivery One dashboard (Orders > Forward Orders > Pending). Pass force=true to override.',
        },
        { status: 400 }
      );
    }

    // Idempotency: If order already has an active AWB and force is false
    if (order.trackingNumber && !order.trackingNumber.startsWith('DLH') && !force) {
      return NextResponse.json({
        success: true,
        alreadyManifested: true,
        waybill: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        message: `Order #${order.orderNumber} is already manifested with AWB ${order.trackingNumber}.`,
        order,
      });
    }

    // Parse destination address
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
    } catch {
      // Keep original string fallback
    }

    const isCod = order.paymentMethod === 'COD';

    // Manifest with Delhivery (allocates AWB and moves order to 'Ready to Ship')
    const delhiveryRes = await createDelhiveryShipment({
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
      codBalanceAmount: Number(
        (order as any).codBalanceAmount ?? (order.total - Number((order as any).advanceAmount || 0))
      ),
      paymentMethod: isCod ? 'COD' : 'Prepaid',
      items: order.items.map((it) => ({
        name: it.productName,
        sku: it.productId || it.productName,
        quantity: it.quantity,
        price: it.price,
      })),
    });

    if (!delhiveryRes.success || !delhiveryRes.waybill) {
      const errorMsg = delhiveryRes.message || 'Delhivery manifest generation failed';
      logger.warn('shipping.manifest.admin_rejected', {
        orderNumber: order.orderNumber,
        error: errorMsg,
      });

      await createAuditLogEntry({
        actorId: session.id,
        actorEmail: session.email,
        actorRole: session.role,
        action: 'ORDER_MANIFEST_FAILED',
        resource: 'ORDER',
        resourceId: id,
        status: 'FAILED',
        diffJson: JSON.stringify({ error: errorMsg }),
      });

      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const trackingUrl =
      delhiveryRes.trackingUrl ||
      `https://www.delhivery.com/track/package/${delhiveryRes.waybill}`;

    // Update order with confirmed Delhivery AWB
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber: delhiveryRes.waybill,
        trackingUrl,
        carrier: 'Delhivery',
        orderStatus: order.orderStatus === 'PENDING' ? 'CONFIRMED' : order.orderStatus,
      },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    // Record shipment lifecycle event
    await prisma.shipmentEvent.create({
      data: {
        orderId: id,
        status: 'READY_TO_SHIP',
        description: `Shipment accepted and manifested with Delhivery Logistics (AWB: ${delhiveryRes.waybill}). Ready to ship.`,
        location: 'Herbic Cure Fulfillment Facility',
      },
    });

    // Audit log
    await createAuditLogEntry({
      actorId: session.id,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'ORDER_MANIFESTED_DELHIVERY',
      resource: 'ORDER',
      resourceId: id,
      status: 'SUCCESS',
      diffJson: JSON.stringify({
        waybill: delhiveryRes.waybill,
        carrier: 'Delhivery',
      }),
    });

    logger.info('shipping.manifest.accepted', {
      orderNumber: order.orderNumber,
      waybill: delhiveryRes.waybill,
    });

    return NextResponse.json({
      success: true,
      waybill: delhiveryRes.waybill,
      trackingUrl,
      message: `Order #${order.orderNumber} successfully accepted & manifested! Delhivery AWB: ${delhiveryRes.waybill}`,
      order: updatedOrder,
    });
  } catch (error: any) {
    logger.error('admin.order.manifest_failed', {
      error: error?.message || 'Failed to manifest order',
    });
    return NextResponse.json(
      { error: error?.message || 'Failed to manifest order with Delhivery' },
      { status: 500 }
    );
  }
}
