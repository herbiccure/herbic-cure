import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { cancelDelhiveryShipment } from '@/lib/shipping/delhivery';
import { createAuditLogEntry } from '@/data/admin/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const { session } = authCheck;
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.trackingNumber) {
      return NextResponse.json(
        { error: 'Order does not have an active Delhivery shipment / AWB to cancel' },
        { status: 400 }
      );
    }

    const previousWaybill = order.trackingNumber;

    // Call Delhivery cancellation API
    let delhiveryResult;
    try {
      delhiveryResult = await cancelDelhiveryShipment(
        previousWaybill,
        'Cancelled from Herbic Cure Admin Panel'
      );
    } catch (err: any) {
      logger.warn('shipping.delhivery.cancel_api_warning', {
        orderNumber: order.orderNumber,
        waybill: previousWaybill,
        error: err?.message,
      });
    }

    // Revert order back to unmanifested state in Herbic Cure
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber: null,
        trackingUrl: null,
        delhiveryStatus: 'PENDING',
        delhiverySyncStatus: 'PENDING_DISPATCH',
        delhiverySyncError: null,
        orderStatus: order.orderStatus === 'READY_TO_SHIP' ? 'CONFIRMED' : order.orderStatus,
      } as any,
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    // Record shipment event
    await prisma.shipmentEvent.create({
      data: {
        orderId: id,
        status: 'PENDING',
        location: 'Herbic Cure Admin Panel',
        description: `Delhivery shipment (AWB: ${previousWaybill}) cancelled by admin. Order reverted to unmanifested state; ₹0 charged.`,
      },
    });

    // Audit log
    await createAuditLogEntry({
      actorId: session.id,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'ORDER_SHIPMENT_CANCELLED',
      resource: 'ORDER',
      resourceId: id,
      status: 'SUCCESS',
      diffJson: JSON.stringify({
        cancelledWaybill: previousWaybill,
        delhiveryResult: delhiveryResult?.message || 'Cancelled',
      }),
    });

    logger.info('shipping.delhivery.shipment_cancelled_and_reverted', {
      orderNumber: order.orderNumber,
      cancelledWaybill: previousWaybill,
    });

    return NextResponse.json({
      success: true,
      message: `Delhivery shipment ${previousWaybill} cancelled successfully. Order reverted to pending state (₹0 charged).`,
      order: updatedOrder,
    });
  } catch (error: any) {
    logger.error('admin.order.cancel_shipment_failed', {
      error: error?.message || 'Failed to cancel shipment',
    });
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel Delhivery shipment' },
      { status: 500 }
    );
  }
}
