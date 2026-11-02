import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { cancelOrderWithLogistics } from '@/lib/shipping/orderCancellation';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/orders/[id]/reject
 * Rejects an order, cancels any external shipment/AWB,
 * restores product inventory stock, and marks order as CANCELLED.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (existingOrder.orderStatus === 'CANCELLED') {
      return NextResponse.json({
        success: true,
        message: `Order #${existingOrder.orderNumber} is already cancelled.`,
        order: existingOrder,
      });
    }

    const cancelResult = await cancelOrderWithLogistics({
      orderId: id,
      reason: reason || 'Order rejected by store administrator during review',
      cancelledBy: 'ADMIN',
    });

    const finalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    logger.info('admin.order.rejected', {
      orderId: id,
      orderNumber: existingOrder.orderNumber,
      reason: reason || 'Rejected by admin',
    });

    return NextResponse.json({
      success: true,
      message: `Order #${existingOrder.orderNumber} rejected and cancelled. Inventory stock restored.`,
      order: finalOrder,
      delhivery: cancelResult.delhivery,
    });
  } catch (error: any) {
    logger.error('admin.order.reject_failed', { error: error?.message || 'Failed to reject order' });
    return NextResponse.json({ error: error?.message || 'Failed to reject order' }, { status: 500 });
  }
}

