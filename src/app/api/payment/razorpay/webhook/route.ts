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
      const advanceAmount = Number((dbOrder as any).advanceAmount ?? 0);
      const codBalanceAmount = Number((dbOrder as any).codBalanceAmount ?? (dbOrder.total - advanceAmount));
      const existingAdvancePaymentId = (dbOrder as any).advancePaymentId ?? null;
      const existingAdvancePaidAt = (dbOrder as any).advancePaidAt ?? null;

      const isCodAdvanceOrder = dbOrder.paymentMethod === 'COD' && advanceAmount > 0;
      const expectedAmount = isCodAdvanceOrder ? advanceAmount : dbOrder.total;
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

      const isPartiallyPaid = isCodAdvanceOrder && codBalanceAmount > 0;
      const paymentId = paymentEntity?.id || null;

      // Idempotently update order status
      await prisma.order.update({
        where: { id: dbOrder.id },
        data: {
          paymentStatus: isPartiallyPaid ? 'PARTIALLY_PAID' : 'PAID',
          orderStatus: 'CONFIRMED',
          paymentMethod: dbOrder.paymentMethod, // Preserve 'COD' for COD advance orders
          advancePaymentId: isCodAdvanceOrder ? (paymentId || existingAdvancePaymentId) : existingAdvancePaymentId,
          advancePaidAt: isCodAdvanceOrder ? (existingAdvancePaidAt || new Date()) : existingAdvancePaidAt,
        } as any,
      });

      const eventDescription = isCodAdvanceOrder
        ? `COD advance payment of ₹${advanceAmount} verified via Razorpay Webhook (${event}). Remaining balance ₹${codBalanceAmount} to be collected on delivery.`
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

      // Stage order into Delhivery One Pending queue (or manifest if auto_manifest enabled)
      sendOrderToDelhiveryPending(dbOrder.id).catch((err: any) => {
        logger.warn('shipping.delhivery_pending.webhook_dispatch_failed', {
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

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Herbic Cure Razorpay Payment Webhook Service',
    timestamp: new Date().toISOString(),
  });
}

