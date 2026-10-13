import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting: max 20 order track queries per minute per IP
    const rateLimitError = enforceRateLimit(request, 'order_tracking', 20, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || !q.trim() || q.length > 100) {
      return NextResponse.json({ error: 'Order number or mobile number is required' }, { status: 400 });
    }

    const qClean = q.trim();

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: { equals: qClean } },
          { customerPhone: { equals: qClean.replace(/\D/g, '').slice(-10) } },
          { customerEmail: { equals: qClean.toLowerCase() } },
        ],
      },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      return NextResponse.json({
        found: false,
        message: `No active order found matching "${qClean}". Please verify your Order ID (e.g. HC-10028) or registered 10-digit mobile number.`,
      });
    }

    // Default timeline events if none exist in DB yet
    const events =
      order.events && order.events.length > 0
        ? order.events
        : [
            {
              id: 'ev-1',
              status: order.orderStatus,
              description: `Order ${order.orderNumber} is currently ${order.orderStatus.toLowerCase()}`,
              location: order.carrier || 'Fulfillment Center',
              timestamp: order.createdAt,
            },
            {
              id: 'ev-0',
              status: 'CONFIRMED',
              description: 'Order confirmed & freshly bottled with 21 Ayurvedic herbs',
              location: 'Hyderabad Apothecary Facility',
              timestamp: order.createdAt,
            },
          ];

    // Mask customer email for public tracking view
    const maskedEmail = order.customerEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return NextResponse.json({
      found: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: maskedEmail,
        orderStatus: order.orderStatus,
        carrier: order.carrier || 'Shiprocket Express',
        trackingNumber:
          order.trackingNumber ||
          `SR${order.orderNumber.replace(/[^0-9]/g, '') || '918237'}IN`,
        total: order.total,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        items: order.items,
        events,
      },
    });
  } catch (error) {
    console.error('Track order error:', error);
    return NextResponse.json({ error: 'Failed to look up shipment' }, { status: 500 });
  }
}
