import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpayPaymentSignature } from '@/lib/payment/razorpay';
import { sendOrderToDelhiveryPending } from '@/lib/shipping/delhiveryPending';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = enforceRateLimit(req, 'razorpay_verify', 20, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await req.json().catch(() => null);
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay verification parameters' },
        { status: 400 }
      );
    }

    // 1. Cryptographically verify signature
    const isValid = verifyRazorpayPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      logger.warn('payment.signature.invalid', { orderId, paymentId: razorpay_payment_id });
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // 2. Fetch order from DB
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found for verification' },
        { status: 404 }
      );
    }

    // 3. Update order payment status
    const advanceAmount = Number((order as any).advanceAmount ?? 0);
    const codBalanceAmount = Number((order as any).codBalanceAmount ?? (order.total - advanceAmount));
    const existingAdvancePaymentId = (order as any).advancePaymentId ?? null;
    const existingAdvancePaidAt = (order as any).advancePaidAt ?? null;

    const isCodAdvanceOrder = order.paymentMethod === 'COD' && advanceAmount > 0;
    const isPartiallyPaid = isCodAdvanceOrder && codBalanceAmount > 0;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: isPartiallyPaid ? 'PARTIALLY_PAID' : 'PAID',
        orderStatus: 'CONFIRMED',
        paymentMethod: order.paymentMethod, // Preserve 'COD' for COD advance orders
        advancePaymentId: isCodAdvanceOrder ? razorpay_payment_id : existingAdvancePaymentId,
        advancePaidAt: isCodAdvanceOrder ? new Date() : existingAdvancePaidAt,
      } as any,
    });

    // 4. Log verified event
    const eventDescription = isCodAdvanceOrder
      ? `COD advance payment of ₹${advanceAmount} confirmed via Razorpay (Payment ID: ${razorpay_payment_id}). Remaining balance ₹${codBalanceAmount} to be collected on delivery.`
      : `Payment of ₹${order.total} confirmed via Razorpay (Payment ID: ${razorpay_payment_id})`;

    await prisma.shipmentEvent.create({
      data: {
        orderId: order.id,
        status: 'PAYMENT_VERIFIED',
        description: eventDescription,
        location: 'Razorpay Secure Gateway',
      },
    }).catch(() => { });

    // Stage order into Delhivery One Pending queue (or manifest if auto_manifest enabled)
    try {
      await sendOrderToDelhiveryPending(order.id);
    } catch (err: any) {
      logger.warn('shipping.delhivery_pending.verify_dispatch_failed', {
        orderId: order.id,
        error: err?.message,
      });
    }

    logger.info('payment.verified', {
      orderId: order.orderNumber,
      paymentId: razorpay_payment_id,
      amount: isCodAdvanceOrder ? advanceAmount : order.total,
      isCodAdvance: isCodAdvanceOrder,
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderNumber,
      isPaid: true,
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    logger.error('payment.verify.failed', { error: error?.message || 'Payment verification failed' });
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
