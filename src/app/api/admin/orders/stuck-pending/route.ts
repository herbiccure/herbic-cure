import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { pollDelhiveryOrderByRefIds } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Monitoring endpoint for orders stuck in Pending queue > 24 hours or with failed sync.
 * GET /api/admin/orders/stuck-pending
 * POST /api/admin/orders/stuck-pending (syncs / resolves stuck orders in bulk)
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request, [
      'OWNER',
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'STORE_MANAGER',
      'SUPPORT',
    ]);
    if (authCheck instanceof NextResponse) return authCheck;

    const threshold24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stuckOrders = await prisma.order.findMany({
      where: {
        orderStatus: { in: ['CONFIRMED', 'PROCESSING'] },
        trackingNumber: null,
        OR: [
          { delhiverySyncStatus: 'FAILED' },
          {
            delhiveryStatus: 'PENDING',
            createdAt: { lt: threshold24h },
          },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        total: true,
        paymentMethod: true,
        orderStatus: true,
        shippingMode: true,
        delhiveryStatus: true,
        delhiverySyncStatus: true,
        delhiverySyncError: true,
        delhiverySyncAttempts: true,
        createdAt: true,
        lastDelhiverySyncAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      count: stuckOrders.length,
      orders: stuckOrders,
    });
  } catch (error: any) {
    logger.error('shipping.stuck_pending.get_failed', { error: error?.message });
    return NextResponse.json(
      { error: error?.message || 'Failed to query stuck pending orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request, [
      'OWNER',
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'STORE_MANAGER',
    ]);
    if (authCheck instanceof NextResponse) return authCheck;

    // Fetch unmanifested orders to poll Delhivery in batch
    const unmanifested = await prisma.order.findMany({
      where: {
        orderStatus: { in: ['CONFIRMED', 'PROCESSING'] },
        trackingNumber: null,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (unmanifested.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unmanifested orders requiring sync',
        discoveredCount: 0,
      });
    }

    const orderNumbers = unmanifested.map((o) => o.orderNumber);
    const lookup = await pollDelhiveryOrderByRefIds(orderNumbers);

    let discoveredCount = 0;
    const resolvedOrders: Array<{ orderNumber: string; waybill: string }> = [];

    for (const pkg of lookup.packages) {
      if (pkg.waybill && pkg.orderNumber) {
        const matchingOrder = unmanifested.find((o) => o.orderNumber === pkg.orderNumber);
        if (matchingOrder) {
          await prisma.order.update({
            where: { id: matchingOrder.id },
            data: {
              trackingNumber: pkg.waybill,
              trackingUrl: `https://www.delhivery.com/track/package/${pkg.waybill}`,
              carrier: 'Delhivery',
              delhiveryStatus: 'MANIFESTED',
              delhiverySyncStatus: 'SYNCED',
              lastDelhiverySyncAt: new Date(),
            },
          });

          await prisma.shipmentEvent.create({
            data: {
              orderId: matchingOrder.id,
              status: 'READY_TO_SHIP',
              location: 'Delhivery One Dashboard',
              description: `AWB #${pkg.waybill} discovered via batch sync from Delhivery One.`,
            },
          });

          discoveredCount++;
          resolvedOrders.push({
            orderNumber: matchingOrder.orderNumber,
            waybill: pkg.waybill,
          });
        }
      }
    }

    logger.info('shipping.stuck_pending.batch_sync', {
      totalQueried: orderNumbers.length,
      discoveredCount,
    });

    return NextResponse.json({
      success: true,
      message: `Batch sync complete. Discovered ${discoveredCount} newly manifested AWBs.`,
      discoveredCount,
      resolvedOrders,
    });
  } catch (error: any) {
    logger.error('shipping.stuck_pending.post_failed', { error: error?.message });
    return NextResponse.json(
      { error: error?.message || 'Failed to execute batch sync' },
      { status: 500 }
    );
  }
}
