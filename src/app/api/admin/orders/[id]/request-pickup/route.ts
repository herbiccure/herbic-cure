import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { createAuditLogEntry } from '@/data/admin/audit';
import { requestDelhiveryPickup } from '@/lib/shipping/delhivery';
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
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.orderStatus === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot request pickup for a cancelled order' },
        { status: 400 }
      );
    }

    if (!order.trackingNumber) {
      return NextResponse.json(
        {
          error:
            'Cannot request pickup without an active Delhivery waybill (AWB). Please manifest the shipment first.',
        },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { pickupDate, pickupTime, pickupLocation, force } = body;

    // Idempotency: Prevent duplicate pickup calls if pickup is already successfully scheduled
    if (order.pickupStatus === 'SCHEDULED' && order.pickupRequestId && !force) {
      return NextResponse.json({
        success: true,
        alreadyScheduled: true,
        pickupId: order.pickupRequestId,
        pickupStatus: order.pickupStatus,
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
        message: `Pickup already scheduled (Request ID: ${order.pickupRequestId}). Use 'force: true' to reschedule.`,
      });
    }

    // Call Delhivery First-Mile pickup service (/fm/request/new/)
    const pickupRes = await requestDelhiveryPickup({
      pickupDate,
      pickupTime,
      pickupLocation,
      expectedPackageCount: 1,
    });

    const now = new Date();

    if (pickupRes.success) {
      let parsedPickupDate: Date | null = null;
      try {
        parsedPickupDate = new Date(`${pickupRes.pickupDate}T${pickupRes.pickupTime}`);
      } catch {
        parsedPickupDate = new Date();
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          pickupStatus: 'SCHEDULED',
          pickupRequestId: pickupRes.pickupId || null,
          pickupDate: parsedPickupDate,
          pickupTime: pickupRes.pickupTime,
          pickupError: null,
          pickupAttempts: { increment: 1 },
          lastPickupAttemptAt: now,
        },
      });

      // Create milestone event for order tracking
      await prisma.shipmentEvent.create({
        data: {
          orderId: id,
          status: 'PICKUP_SCHEDULED',
          description: `Delhivery pickup scheduled for ${pickupRes.pickupDate} at ${pickupRes.pickupTime} (Request ID: ${pickupRes.pickupId || 'N/A'})`,
          location: 'Delhivery Fulfillment Hub',
        },
      });

      // Audit log entry
      await createAuditLogEntry({
        actorId: session.id,
        actorEmail: session.email,
        actorRole: session.role,
        action: 'ORDER_REQUEST_PICKUP',
        resource: 'ORDER',
        resourceId: id,
        diffJson: JSON.stringify({
          status: 'SCHEDULED',
          pickupId: pickupRes.pickupId,
          pickupDate: pickupRes.pickupDate,
          pickupTime: pickupRes.pickupTime,
        }),
      });

      return NextResponse.json({
        success: true,
        pickupStatus: 'SCHEDULED',
        pickupId: pickupRes.pickupId,
        pickupDate: pickupRes.pickupDate,
        pickupTime: pickupRes.pickupTime,
        message: pickupRes.message,
        order: updatedOrder,
      });
    } else {
      // Record failure state and error message for staff visibility
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          pickupStatus: 'FAILED',
          pickupError: pickupRes.message,
          pickupAttempts: { increment: 1 },
          lastPickupAttemptAt: now,
        },
      });

      // Audit log entry for failed attempt
      await createAuditLogEntry({
        actorId: session.id,
        actorEmail: session.email,
        actorRole: session.role,
        action: 'ORDER_REQUEST_PICKUP_FAILED',
        resource: 'ORDER',
        resourceId: id,
        status: 'FAILED',
        diffJson: JSON.stringify({
          error: pickupRes.message,
          pickupDate: pickupRes.pickupDate,
          pickupTime: pickupRes.pickupTime,
        }),
      });

      return NextResponse.json(
        {
          success: false,
          pickupStatus: 'FAILED',
          error: pickupRes.message,
          order: updatedOrder,
        },
        { status: 422 }
      );
    }
  } catch (error: any) {
    logger.error('admin.order.request_pickup_failed', { error: error?.message || 'Failed to request pickup' });
    return NextResponse.json(
      { error: error?.message || 'Failed to request pickup' },
      { status: 500 }
    );
  }
}
