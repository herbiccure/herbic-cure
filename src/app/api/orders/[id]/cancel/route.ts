import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/server';
import { verifySessionToken, CustomerSessionPayload, AdminSessionPayload } from '@/lib/auth/session';
import { cancelOrderWithLogistics } from '@/lib/shipping/orderCancellation';
import { enforceRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // 1. Rate limiting
    const rateLimitError = enforceRateLimit(request, 'order_cancellation', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason = (body.reason || '').trim() || 'Customer requested order cancellation';

    // 2. Multi-tier session authentication (BetterAuth, legacy customer cookie, or admin cookie)
    const session = await getServerSession();
    const customerToken = request.cookies.get('customer_session')?.value;
    const adminToken = request.cookies.get('admin_session')?.value;

    const customerPayload = customerToken ? verifySessionToken<CustomerSessionPayload>(customerToken) : null;
    const adminPayload = adminToken ? verifySessionToken<AdminSessionPayload>(adminToken) : null;

    const authenticatedUserId = session?.user?.id || customerPayload?.id || null;
    const authenticatedEmail = (session?.user?.email || customerPayload?.email || '').toLowerCase().trim() || null;
    const isAdmin = Boolean(adminPayload || session?.user?.role === 'ADMIN');

    if (!authenticatedUserId && !authenticatedEmail && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to cancel an order' },
        { status: 401 }
      );
    }

    // 3. Find the order by id or orderNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 4. Strict Anti-IDOR Ownership Verification (unless admin)
    if (!isAdmin) {
      const isOwner =
        (authenticatedUserId && order.userId === authenticatedUserId) ||
        (authenticatedEmail && order.customerEmail.toLowerCase().trim() === authenticatedEmail);

      if (!isOwner) {
        return NextResponse.json(
          { error: 'Forbidden: You are not authorized to cancel this order' },
          { status: 403 }
        );
      }
    }

    // 5. Check if order is eligible for cancellation
    const nonCancellableStatuses = ['DELIVERED', 'RETURNED', 'REFUNDED'];
    if (nonCancellableStatuses.includes(order.orderStatus)) {
      return NextResponse.json(
        {
          error: `Order cannot be cancelled because it is already marked as ${order.orderStatus}. Please contact customer care.`,
        },
        { status: 400 }
      );
    }

    // 6. Execute cancellation with Delhivery Express API call + inventory restock
    const cancelResult = await cancelOrderWithLogistics({
      orderId: order.id,
      reason,
      cancelledBy: isAdmin ? 'ADMIN' : 'CUSTOMER',
    });

    return NextResponse.json({
      success: true,
      message: cancelResult.message,
      orderNumber: cancelResult.orderNumber,
      orderStatus: cancelResult.orderStatus,
      delhivery: cancelResult.delhivery,
      restockedItemsCount: cancelResult.restockedItemsCount,
    });
  } catch (error: any) {
    console.error('Order cancellation endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
