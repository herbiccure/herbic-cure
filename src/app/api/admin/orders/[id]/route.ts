import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

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
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;
    await prisma.order.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
