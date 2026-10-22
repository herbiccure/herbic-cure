import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRazorpayOrder } from '@/lib/payment/razorpay';
import { enforceRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = enforceRateLimit(req, 'razorpay_create_order', 15, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await req.json().catch(() => null);
    const { orderId } = body || {};

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order reference ID is required' },
        { status: 400 }
      );
    }

    // Look up order in database
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

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Order has already been paid' },
        { status: 400 }
      );
    }

    // Create authoritative Razorpay order
    const rzOrder = await createRazorpayOrder({
      orderNumber: order.orderNumber,
      amount: order.total,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderNumber,
      razorpayOrderId: rzOrder.razorpayOrderId,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: rzOrder.keyId,
    });
  } catch (error: any) {
    console.error('Razorpay create-order API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize Razorpay payment order' },
      { status: 500 }
    );
  }
}
