import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpayWebhookSignature } from '@/lib/payment/razorpay';
import { sendOrderToDelhiveryPending } from '@/lib/shipping/delhiveryPending';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn('payment.webhook.signature_failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const orderNumber =
      paymentEntity?.notes?.orderNumber ||
      orderEntity?.notes?.orderNumber ||
      orderEntity?.receipt ||
      paymentEntity?.description;

    if (!orderNumber) {
      return NextResponse.json({ received: true, note: 'No matching orderNumber identifier' });
    }

    if (event === 'order.paid' || event === 'payment.captured') {
      const dbOrder = await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      });

      if (!dbOrder) {
        return NextResponse.json({ received: true, note: 'Order not found in database' });
      }

      // Verify payment amount matches expected amount (advance for COD with advance, full total for prepaid)
      const isCodAdvanceOrder = dbOrder.paymentMethod === 'COD' && dbOrder.advanceAmount > 0;
      const expectedAmount = isCodAdvanceOrder ? dbOrder.advanceAmount : dbOrder.total;
      const expectedPaise = Math.round(expectedAmount * 100);
      const paidPaise = paymentEntity?.amount || orderEntity?.amount;

      if (paidPaise && paidPaise < expectedPaise) {
        logger.error('payment.amount.mismatch', {
          orderNumber,
          expectedPaise,
          paidPaise,
        });
        return NextResponse.json(
          { error: 'Payment amount mismatch' },
          { status: 400 }
        );
      }

      const isPartiallyPaid = isCodAdvanceOrder && (dbOrder.codBalanceAmount ?? 0) > 0;
      const paymentId = paymentEntity?.id || null;

      // Idempotently update order status
      await prisma.order.update({
        where: { id: dbOrder.id },
        data: {
          paymentStatus: isPartiallyPaid ? 'PARTIALLY_PAID' : 'PAID',
          orderStatus: 'CONFIRMED',
          paymentMethod: dbOrder.paymentMethod, // Preserve 'COD' for COD advance orders
          advancePaymentId: isCodAdvanceOrder ? (paymentId || dbOrder.advancePaymentId) : dbOrder.advancePaymentId,
          advancePaidAt: isCodAdvanceOrder ? (dbOrder.advancePaidAt || new Date()) : dbOrder.advancePaidAt,
        },
      });

      const eventDescription = isCodAdvanceOrder
        ? `COD advance payment of ₹${dbOrder.advanceAmount} verified via Razorpay Webhook (${event}). Remaining balance ₹${dbOrder.codBalanceAmount ?? 0} to be collected on delivery.`
        : `Payment of ₹${dbOrder.total} verified via Razorpay Webhook (${event})`;

      // Log event
      await prisma.shipmentEvent.create({
        data: {
          orderId: dbOrder.id,
          status: 'PAYMENT_VERIFIED',
          description: eventDescription,
          location: 'Razorpay Webhook Service',
        },
      }).catch(() => {});

      // Stage order in Delhivery One Pending queue (unmanifested, ₹0 charged)
      sendOrderToDelhiveryPending(dbOrder.id).catch((err) => {
        logger.warn('shipping.delhivery_pending.webhook_async_error', {
          orderId: dbOrder.id,
          error: err?.message,
        });
      });
    } else if (event === 'payment.failed') {
      await prisma.order.updateMany({
        where: { orderNumber },
        data: { paymentStatus: 'FAILED' },
      });
      logger.warn('payment.failed', { orderNumber });
    }

    logger.info('payment.webhook.processed', { event, orderNumber });
    return NextResponse.json({ status: 'ok', receivedEvent: event });
  } catch (error: any) {
    logger.error('payment.webhook.processing_failed', { error: error?.message });
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
