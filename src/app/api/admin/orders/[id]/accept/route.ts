import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/orders/[id]/accept
 * Accepts a placed or pending order, marks it READY_TO_SHIP,
 * and moves it directly to the "Ready to Ship" queue.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { note } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (existingOrder.orderStatus === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot accept a cancelled order. Please create a new order instead.' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: 'READY_TO_SHIP',
        delhiveryStatus: 'READY_TO_SHIP',
        delhiverySyncStatus: 'SYNCED',
        lastDelhiverySyncAt: new Date(),
      },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    // Log the acceptance milestone
    await prisma.shipmentEvent.create({
      data: {
        orderId: id,
        status: 'READY_TO_SHIP',
        description: note || 'Order accepted by store administrator and marked Ready to Ship',
        location: existingOrder.carrier || 'Fulfillment Facility',
      },
    });

    logger.info('admin.order.accepted', {
      orderId: id,
      orderNumber: existingOrder.orderNumber,
      status: 'READY_TO_SHIP',
    });

    return NextResponse.json({
      success: true,
      message: `Order #${existingOrder.orderNumber} accepted successfully! Moved to Ready to Ship.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    logger.error('admin.order.accept_failed', { error: error?.message || 'Failed to accept order' });
    return NextResponse.json({ error: error?.message || 'Failed to accept order' }, { status: 500 });
  }
}

