import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCashfreeWebhook } from '@/lib/payment/cashfree';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';

    // Verify cryptographic signature from Cashfree
    const isValid = verifyCashfreeWebhook(rawBody, signature, timestamp);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;
    const eventType = payload.type; // e.g. PAYMENT_SUCCESS_WEBHOOK

    const orderNumber = orderData?.order_id;
    if (!orderNumber) {
      return NextResponse.json({ received: true, note: 'No order_id present' });
    }

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || paymentData?.payment_status === 'SUCCESS') {
      await prisma.order.updateMany({
        where: { orderNumber },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          paymentMethod: 'CASHFREE',
        },
      });

      // Log event
      const order = await prisma.order.findUnique({ where: { orderNumber } });
      if (order) {
        await prisma.shipmentEvent.create({
          data: {
            orderId: order.id,
            status: 'PAYMENT_VERIFIED',
            description: `Payment of ₹${order.total} confirmed via Cashfree Payment Gateway`,
            location: 'Cashfree Secure Gateway',
          },
        }).catch(() => {});
      }
    } else if (eventType === 'PAYMENT_FAILED_WEBHOOK' || paymentData?.payment_status === 'FAILED') {
      await prisma.order.updateMany({
        where: { orderNumber },
        data: {
          paymentStatus: 'FAILED',
        },
      });
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error: any) {
    console.error('Cashfree webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing exception' },
      { status: 500 }
    );
  }
}
