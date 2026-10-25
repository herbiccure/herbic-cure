import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { trackDelhiveryShipment, isDelhiveryCancelled } from '@/lib/shipping/delhivery';
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

    if (!order.trackingNumber) {
      return NextResponse.json(
        { error: 'Order does not have a Delhivery Waybill / AWB tracking number yet' },
        { status: 400 }
      );
    }

    // 1. Fetch live tracking info from Delhivery
    const tracking = await trackDelhiveryShipment(order.trackingNumber);

    // 2. Check if Delhivery reports the package as CANCELLED
    const isCancelledInDelhivery = isDelhiveryCancelled(tracking.status, tracking.scans);

    if (isCancelledInDelhivery && order.orderStatus !== 'CANCELLED') {
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

    // If status is active / in transit
    return NextResponse.json({
      success: true,
      isCancelled: false,
      orderStatus: order.orderStatus,
      order,
      tracking,
      message: `Delhivery live status: ${tracking.status || 'IN_TRANSIT'}. Expected Delivery: ${tracking.expectedDeliveryDate ? new Date(tracking.expectedDeliveryDate).toLocaleDateString('en-IN') : '2-4 days'}`,
    });
  } catch (error: any) {
    logger.error('admin.order.sync_delhivery_failed', { error: error?.message || 'Failed to sync with Delhivery' });
    return NextResponse.json(
      { error: error?.message || 'Failed to sync with Delhivery logistics server' },
      { status: 500 }
    );
  }
}
