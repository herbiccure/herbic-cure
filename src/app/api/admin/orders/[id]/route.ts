import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { cancelOrderWithLogistics } from '@/lib/shipping/orderCancellation';
import { cancelDelhiveryShipment } from '@/lib/shipping/delhivery';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
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

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;
    const body = await request.json();
    const { orderStatus, trackingNumber, carrier, eventDescription } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order is transitioning to CANCELLED, execute complete cancellation workflow with Delhivery
    if (orderStatus === 'CANCELLED' && existingOrder.orderStatus !== 'CANCELLED') {
      const cancelResult = await cancelOrderWithLogistics({
        orderId: id,
        reason: eventDescription || 'Cancelled by store administrator',
        cancelledBy: 'ADMIN',
      });

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
        delhivery: cancelResult.delhivery,
        message: cancelResult.message,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: orderStatus || undefined,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        carrier: carrier !== undefined ? carrier : undefined,
      },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    // If an event description or status changed, log a ShipmentEvent
    if (eventDescription || (orderStatus && orderStatus !== existingOrder.orderStatus)) {
      await prisma.shipmentEvent.create({
        data: {
          orderId: id,
          status: orderStatus || existingOrder.orderStatus,
          description: eventDescription || `Order status updated to ${orderStatus || existingOrder.orderStatus}`,
          location: carrier || 'Fulfillment Center',
        },
      });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;
    const existing = await prisma.order.findUnique({ where: { id } });

    if (existing?.trackingNumber && existing.orderStatus !== 'CANCELLED') {
      try {
        await cancelDelhiveryShipment(existing.trackingNumber, 'Order deleted by admin');
      } catch (delhErr) {
        console.warn('Delhivery delete cancel warning:', delhErr);
      }
    }

    await prisma.order.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Order deleted and Delhivery shipment cancelled' });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
