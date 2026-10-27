import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { trackDelhiveryShipment, mapDelhiveryStatusToOrderStatus } from '@/lib/shipping/delhivery';
import { cancelOrderWithLogistics } from '@/lib/shipping/orderCancellation';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

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

    // If order does not have an AWB yet, query Delhivery One via orderNumber (ref_ids)
    // to discover if warehouse staff clicked "Get AWB number" in Delhivery One dashboard
    if (!order.trackingNumber) {
      const { syncOrderFromDelhiveryRefId, sendOrderToDelhiveryPending } = await import('@/lib/shipping/delhiveryPending');

      // If sync failed earlier, retry staging to Delhivery
      if (order.delhiverySyncStatus === 'FAILED') {
        const retryResult = await sendOrderToDelhiveryPending(order.id);
        const refreshed = await prisma.order.findUnique({
          where: { id },
          include: { items: true, events: { orderBy: { timestamp: 'desc' } } },
        });
        return NextResponse.json({
          success: retryResult.success,
          isPending: retryResult.status === 'PENDING',
          order: refreshed,
          message: retryResult.message || (retryResult.success ? 'Order re-staged in Delhivery One Pending queue' : 'Retry staging failed'),
        });
      }

      const syncRes = await syncOrderFromDelhiveryRefId(order.id);
      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: { items: true, events: { orderBy: { timestamp: 'desc' } } },
      });

      if (syncRes.discoveredAwb && updatedOrder?.trackingNumber) {
        const tracking = await trackDelhiveryShipment(updatedOrder.trackingNumber);
        return NextResponse.json({
          success: true,
          order: updatedOrder,
          tracking,
          message: `Discovered AWB #${updatedOrder.trackingNumber} from Delhivery One. Order is now manifested!`,
        });
      }

      return NextResponse.json({
        success: true,
        isPending: syncRes.isPending,
        order: updatedOrder,
        message: syncRes.message || 'Order is staged in Delhivery One Pending queue. Awaiting warehouse staff verification.',
      });
    }

    // 1. Fetch live tracking info from Delhivery
    const tracking = await trackDelhiveryShipment(order.trackingNumber);

    // 2. Map tracking status to Herbic Cure order lifecycle
    const mapped = mapDelhiveryStatusToOrderStatus(tracking.status, tracking.scans);

    // Check cancellation
    if (mapped.isCancelled && order.orderStatus !== 'CANCELLED') {
      // Auto-cancel in database and restock inventory
      const cancelResult = await cancelOrderWithLogistics({
        orderId: order.id,
        reason: `Synchronized from Delhivery: Shipment cancelled on Delhivery network (Status: ${tracking.status})`,
        cancelledBy: 'ADMIN',
      });

      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          events: { orderBy: { timestamp: 'desc' } },
        },
      });

      return NextResponse.json({
        success: true,
        isCancelled: true,
        orderStatus: 'CANCELLED',
        order: updatedOrder,
        tracking,
        message: `Order ${order.orderNumber} was cancelled in Delhivery and is now marked CANCELLED in Admin.`,
        delhiveryMessage: cancelResult.message,
      });
    }

    // If order is already cancelled
    if (order.orderStatus === 'CANCELLED') {
      return NextResponse.json({
        success: true,
        isCancelled: true,
        orderStatus: 'CANCELLED',
        order,
        tracking,
        message: 'Order is already marked as CANCELLED in system.',
      });
    }

    // 3. Update order lifecycle status if changed
    let needsUpdate = false;
    const updateData: {
      orderStatus?: string;
      pickupStatus?: string;
      paymentStatus?: string;
    } = {};

    if (mapped.isDelivered && order.orderStatus !== 'DELIVERED') {
      updateData.orderStatus = 'DELIVERED';
      updateData.pickupStatus = 'PICKED';
      if (order.paymentMethod === 'COD') updateData.paymentStatus = 'PAID';
      needsUpdate = true;
    } else if (
      mapped.orderStatus === 'OUT_FOR_DELIVERY' &&
      order.orderStatus !== 'DELIVERED' &&
      order.orderStatus !== 'OUT_FOR_DELIVERY'
    ) {
      updateData.orderStatus = 'OUT_FOR_DELIVERY';
      updateData.pickupStatus = 'PICKED';
      needsUpdate = true;
    } else if (mapped.orderStatus === 'SHIPPED') {
      const allowed = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'];
      if (allowed.includes(order.orderStatus)) {
        updateData.orderStatus = 'SHIPPED';
        updateData.pickupStatus = 'PICKED';
        needsUpdate = true;
      }
    }

    if (
      mapped.pickupStatus === 'SCHEDULED' &&
      order.pickupStatus !== 'SCHEDULED' &&
      order.pickupStatus !== 'PICKED'
    ) {
      updateData.pickupStatus = 'SCHEDULED';
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.order.update({
        where: { id },
        data: updateData,
      });

      await prisma.shipmentEvent.create({
        data: {
          orderId: id,
          status: updateData.orderStatus || order.orderStatus,
          location: tracking.destination || tracking.origin || 'Delhivery Logistics Hub',
          description: mapped.description || `Synchronized live status from Delhivery: ${tracking.status}`,
        },
      });
    }

    const finalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    return NextResponse.json({
      success: true,
      isCancelled: false,
      orderStatus: finalOrder?.orderStatus || order.orderStatus,
      order: finalOrder,
      tracking,
      message: `Delhivery live status: ${tracking.status || 'IN_TRANSIT'}. Synced to Admin (Status: ${finalOrder?.orderStatus}).`,
    });
  } catch (error: any) {
    logger.error('admin.order.sync_delhivery_failed', { error: error?.message || 'Failed to sync with Delhivery' });
    return NextResponse.json(
      { error: error?.message || 'Failed to sync with Delhivery logistics server' },
      { status: 500 }
    );
  }
}
