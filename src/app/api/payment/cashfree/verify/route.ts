import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCashfreeOrderStatus } from '@/lib/payment/cashfree';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId') || '';

    if (!orderId) {
      return NextResponse.redirect(new URL('/checkout?error=Missing+order+id', req.url));
    }

    // 1. Verify with Cashfree PG
    const cashfreeStatus = await getCashfreeOrderStatus(orderId);
    const isPaid = cashfreeStatus.orderStatus === 'PAID';

    // 2. Update Database order record
    if (isPaid) {
      await prisma.order.updateMany({
        where: { orderNumber: orderId },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          paymentMethod: 'CASHFREE',
        },
      });
    }

    // Check if client expects JSON or Browser redirect
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('application/json')) {
      return NextResponse.json({
        success: true,
        orderId,
        isPaid,
        orderStatus: isPaid ? 'CONFIRMED' : cashfreeStatus.orderStatus,
      });
    }

    // Redirect to Order Success or Checkout
    if (isPaid) {
      return NextResponse.redirect(new URL(`/order-success?orderId=${orderId}`, req.url));
    } else {
      return NextResponse.redirect(
        new URL(`/checkout?error=Payment+${cashfreeStatus.orderStatus.toLowerCase()}`, req.url)
      );
    }
  } catch (error: any) {
    console.error('Cashfree verification error:', error);
    return NextResponse.redirect(new URL('/checkout?error=Payment+verification+error', req.url));
  }
}
