import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { createAuditLogEntry } from '@/data/admin/audit';
import { scheduleDailyDelhiveryPickup } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/orders/[id]/mark-packed
 * Confirms that warehouse staff has verified and packed the parcel with printed shipping label.
 * Transitions order to PACKED status, satisfying the warehouse-ready condition before courier pickup.
 */
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

    const session = authCheck && 'session' in authCheck ? authCheck.session : null;
    const actorEmail = (session as any)?.email || (session as any)?.user?.email || 'warehouse@herbiccure.com';
    const actorId = (session as any)?.id || (session as any)?.user?.id || 'admin';
    const actorRole = (session as any)?.role || 'ADMIN';

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
        { error: 'Cannot mark a cancelled order as packed' },
        { status: 400 }
      );
    }

    if (order.orderStatus === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Order has already been delivered' },
        { status: 400 }
      );
    }

    if (!order.trackingNumber) {
      return NextResponse.json(
        { error: 'Shipment must be manifested with an AWB before it can be marked as packed' },
        { status: 400 }
      );
    }

    // Determine new pickup status
    // If order is already SCHEDULED or PICKED, retain it; otherwise transition to PACKED
    const nextPickupStatus = (order.pickupStatus === 'SCHEDULED' || order.pickupStatus === 'PICKED')
      ? order.pickupStatus
      : 'PACKED';

    await prisma.order.update({
      where: { id },
      data: {
        packedAt: new Date(),
        packedBy: actorEmail,
        pickupStatus: nextPickupStatus,
      },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    await prisma.shipmentEvent.create({
      data: {
        orderId: id,
        status: 'PACKED',
        location: 'Herbic Cure Warehouse',
        description: `Order packed and shipping label attached by ${actorEmail}. Ready for courier pickup.`,
      },
    });

    await createAuditLogEntry({
      actorId,
      actorEmail,
      actorRole,
      action: 'ORDER_PACKED',
      resource: 'Order',
      resourceId: id,
      diff: {
        orderNumber: order.orderNumber,
        packedBy: actorEmail,
        pickupStatus: nextPickupStatus,
      },
      status: 'SUCCESS',
      request,
    });

    logger.info('shipping.order.packed', {
      orderId: id,
      orderNumber: order.orderNumber,
      packedBy: actorEmail,
      pickupStatus: nextPickupStatus,
    });

    // If auto-pickup is enabled in store settings or env, schedule pickup now that parcel is ready
    let autoPickupScheduled = false;
    let autoPickupMsg = '';
    try {
      const pickupSetting = await prisma.siteSetting.findUnique({
        where: { key: 'pickup_mode' },
      });
      if (pickupSetting?.value === 'auto' || process.env.PICKUP_MODE === 'auto') {
        const schedRes = await scheduleDailyDelhiveryPickup({
          orderIds: [order.id],
          requirePacked: true,
        });
        autoPickupScheduled = schedRes.success;
        autoPickupMsg = schedRes.message;
      }
    } catch (schedErr: any) {
      logger.warn('shipping.pickup.auto_schedule_failed', {
        orderId: id,
        error: schedErr?.message,
      });
    }

    // Refresh order to capture any auto-pickup updates
    const finalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    return NextResponse.json({
      success: true,
      order: finalOrder,
      autoPickupScheduled,
      message: autoPickupScheduled
        ? `Order marked packed. ${autoPickupMsg}`
        : 'Order verified and packed successfully. Ready for courier pickup dispatch.',
    });
  } catch (error: any) {
    logger.error('admin.order.mark_packed_failed', { error: error?.message });
    return NextResponse.json(
      { error: error?.message || 'Failed to mark order as packed' },
      { status: 500 }
    );
  }
}

