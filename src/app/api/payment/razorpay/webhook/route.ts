import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpayWebhookSignature } from '@/lib/payment/razorpay';
import { createDelhiveryShipment } from '@/lib/shipping/delhivery';

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
      console.warn('Invalid Razorpay webhook signature received');
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
        console.error(
          `Payment amount mismatch for order ${orderNumber}: expected ${expectedPaise}, received ${paidPaise}`
        );
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

      // Dispatch Delhivery shipment if not manifested
      if (!dbOrder.trackingNumber || dbOrder.trackingNumber.startsWith('DLH')) {
        try {
          let parsedAddress: any = {};
          try {
            parsedAddress = JSON.parse(dbOrder.shippingAddress || '{}');
          } catch {}

          const delhiveryRes = await createDelhiveryShipment({
            orderNumber: dbOrder.orderNumber,
            customerName: dbOrder.customerName,
            customerPhone: dbOrder.customerPhone,
            customerEmail: dbOrder.customerEmail,
            customerAddress: parsedAddress.address || dbOrder.shippingAddress,
            city: parsedAddress.city || '',
            state: parsedAddress.state || '',
            pincode: parsedAddress.pincode || '',
            totalAmount: dbOrder.total,
            shippingFee: dbOrder.shippingFee,
            paymentMethod: 'Prepaid',
            items: dbOrder.items.map((it) => ({
              name: it.productName,
              sku: it.productId || it.productName,
              quantity: it.quantity,
              price: it.price,
            })),
          });

          if (delhiveryRes?.waybill) {
            await prisma.order.update({
              where: { id: dbOrder.id },
              data: {
                trackingNumber: delhiveryRes.waybill,
                trackingUrl:
                  delhiveryRes.trackingUrl ||
                  `https://www.delhivery.com/track/package/${delhiveryRes.waybill}`,
                carrier: 'Delhivery',
              },
            });
          }
        } catch (shipErr) {
          console.warn('Delhivery dispatch post-webhook notification:', shipErr);
        }
      }
    } else if (event === 'payment.failed') {
      await prisma.order.updateMany({
        where: { orderNumber },
        data: { paymentStatus: 'FAILED' },
      });
    }

    return NextResponse.json({ status: 'ok', receivedEvent: event });
  } catch (error: any) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
