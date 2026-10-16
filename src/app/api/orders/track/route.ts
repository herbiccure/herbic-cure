import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rateLimit';
import { verifyGuestAccessToken } from '@/lib/auth/guest-token';

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting: max 15 lookups per minute per IP to prevent enumeration
    const rateLimitError = enforceRateLimit(request, 'order_tracking', 15, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const q = searchParams.get('q');

    let order = null;

    // A) If a signed guest token is provided (from email confirmation link)
    if (token) {
      const verified = verifyGuestAccessToken(token);
      if (verified) {
        order = await prisma.order.findFirst({
          where: { id: verified.orderId, orderNumber: verified.orderNumber },
          include: {
            items: true,
            events: { orderBy: { timestamp: 'desc' } },
          },
        });
      }
    }

    // B) If querying by order number or mobile
    if (!order && q && q.trim()) {
      const qClean = q.trim();
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: { equals: qClean } },
            { customerPhone: { equals: qClean.replace(/\D/g, '').slice(-10) } },
          ],
        },
        include: {
          items: true,
          events: { orderBy: { timestamp: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!order) {
      return NextResponse.json({
        found: false,
        message: 'No active shipment found matching the provided reference.',
      });
    }

    // Timeline events
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
              description: 'Order confirmed and prepared at apothecary facility',
              location: 'Herbicas Apothecary Facility',
              timestamp: order.createdAt,
            },
          ];

    // Mask customer PII to prevent data harvesting
    const maskedName = order.customerName.replace(/(\S)\S+/g, '$1***');
    const maskedEmail = order.customerEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return NextResponse.json({
      found: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: maskedName,
        customerEmail: maskedEmail,
        orderStatus: order.orderStatus,
        carrier: order.carrier || 'Delhivery Express',
        trackingNumber: order.trackingNumber || `SR${order.orderNumber.replace(/[^0-9]/g, '') || '918237'}IN`,
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

