import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { createCashfreeOrder } from '@/lib/payment/cashfree';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = enforceRateLimit(req, 'cashfree_create_order', 15, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to initiate payment' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const { orderId } = body || {};

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order reference ID is required' },
        { status: 400 }
      );
    }

    // Look up the order in database
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order record not found' },
        { status: 404 }
      );
    }

    // Create Cashfree Payment Order
    const cashfreeOrder = await createCashfreeOrder({
      orderId: order.orderNumber,
      orderAmount: order.total,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerId: order.customerId || order.userId || undefined,
    });

    return NextResponse.json({
      success: true,
      paymentSessionId: cashfreeOrder.paymentSessionId,
      orderId: order.orderNumber,
      environment: cashfreeOrder.environment,
    });
  } catch (error: any) {
    console.error('Cashfree create-order API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Cashfree payment session' },
      { status: 500 }
    );
  }
}
