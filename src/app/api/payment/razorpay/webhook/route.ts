import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpayWebhookSignature } from '@/lib/payment/razorpay';
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

      // Verify payment amount matches order total in paise
      const expectedPaise = Math.round(dbOrder.total * 100);
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

      // Idempotently update order status
      await prisma.order.update({
        where: { id: dbOrder.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          paymentMethod: 'RAZORPAY',
        },
      });

      // Log event
      await prisma.shipmentEvent.create({
        data: {
          orderId: dbOrder.id,
          status: 'PAYMENT_VERIFIED',
          description: `Payment of ₹${dbOrder.total} verified via Razorpay Webhook (${event})`,
          location: 'Razorpay Webhook Service',
        },
      }).catch(() => {});

      // Order remains in 'Pending AWB' status until admin verification & acceptance.
      // Charges are NOT deducted from Delhivery until the admin clicks 'Accept & Generate AWB'.
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
