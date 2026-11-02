import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { cancelOrderWithLogistics } from '@/lib/shipping/orderCancellation';
import { createAuditLogEntry } from '@/data/admin/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
    const actorEmail = (session as any)?.email || (session as any)?.user?.email || 'admin@herbiccure.com';
    const actorId = (session as any)?.id || (session as any)?.user?.id || 'admin';
    const actorRole = (session as any)?.role || 'ADMIN';
    const body = await request.json().catch(() => ({}));
    const { orderIds, reason } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'An array of orderIds is required' },
        { status: 400 }
      );
    }

    const rejectionReason = reason?.trim() || 'Rejected by staff during order review';
    const results: Array<{ orderId: string; success: boolean; message: string }> = [];

    for (const orderId of orderIds) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          results.push({ orderId, success: false, message: 'Order not found' });
          continue;
        }

        if (order.orderStatus === 'CANCELLED') {
          results.push({ orderId, success: true, message: 'Order already cancelled' });
          continue;
        }

        await cancelOrderWithLogistics({
          orderId,
          reason: rejectionReason,
          cancelledBy: 'ADMIN',
        });

        await createAuditLogEntry({
          actorId,
          actorEmail,
          actorRole,
          action: 'ORDER_REJECTED_BULK',
          resource: 'Order',
          resourceId: orderId,
          diff: { reason: rejectionReason, orderNumber: order.orderNumber },
          status: 'SUCCESS',
          request,
        });

        results.push({
          orderId,
          success: true,
          message: `Order #${order.orderNumber} rejected and cancelled.`,
        });
      } catch (err: any) {
        logger.warn('admin.order.bulk_reject_item_error', { orderId, error: err?.message });
        results.push({
          orderId,
          success: false,
          message: err?.message || 'Failed to cancel order',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: `${results.filter((r) => r.success).length} of ${orderIds.length} order(s) rejected and cancelled.`,
    });
  } catch (error: any) {
    logger.error('admin.order.bulk_reject_fatal', { error: error?.message });
    return NextResponse.json(
      { error: error?.message || 'Failed to reject orders' },
      { status: 500 }
    );
  }
}
