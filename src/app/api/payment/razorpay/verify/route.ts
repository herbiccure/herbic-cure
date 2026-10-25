import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpayPaymentSignature } from '@/lib/payment/razorpay';
import { createDelhiveryShipment } from '@/lib/shipping/delhivery';
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
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        paymentMethod: 'RAZORPAY',
      },
    });

    // 4. Log verified event
    await prisma.shipmentEvent.create({
      data: {
        orderId: order.id,
        status: 'PAYMENT_VERIFIED',
        description: `Payment of ₹${order.total} confirmed via Razorpay (Payment ID: ${razorpay_payment_id})`,
        location: 'Razorpay Secure Gateway',
      },
    }).catch(() => { });

    // 5. Manifest shipment with Delhivery if not yet manifested
    if (!order.trackingNumber || order.trackingNumber.startsWith('DLH')) {
      try {
        let parsedAddress: any = {};
        try {
          parsedAddress = JSON.parse(order.shippingAddress || '{}');
        } catch { }

        const delhiveryRes = await createDelhiveryShipment({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          customerAddress: parsedAddress.address || order.shippingAddress,
          city: parsedAddress.city || '',
          state: parsedAddress.state || '',
          pincode: parsedAddress.pincode || '',
          totalAmount: order.total,
          shippingFee: order.shippingFee,
          paymentMethod: 'Prepaid',
          items: order.items.map((it) => ({
            name: it.productName,
            sku: it.productId || it.productName,
            quantity: it.quantity,
            price: it.price,
          })),
        });

        if (delhiveryRes?.waybill) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              trackingNumber: delhiveryRes.waybill,
              trackingUrl:
                delhiveryRes.trackingUrl ||
                `https://www.delhivery.com/track/package/${delhiveryRes.waybill}`,
              carrier: 'Delhivery',
            },
          });
        }
      } catch (shipErr: any) {
        logger.warn('shipping.dispatch.post_payment_warning', { orderId: order.orderNumber, error: shipErr?.message });
      }
    }

    logger.info('payment.verified', {
      orderId: order.orderNumber,
      paymentId: razorpay_payment_id,
      amount: order.total,
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
