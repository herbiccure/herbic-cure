import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { createAuditLogEntry } from '@/data/admin/audit';
import { scheduleDailyDelhiveryPickup } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/orders/request-pickup
 * Dispatches a daily pickup request to Delhivery Express for all confirmed/manifested packages waiting for pickup.
 * Implements Problem 3 requirement: one request per day, accurate package count, never in the past.
 */
export async function POST(request: NextRequest) {
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

    const session = authCheck && 'session' in authCheck ? authCheck.session : null;
    const actorEmail = (session as any)?.email || (session as any)?.user?.email || 'admin@herbiccure.com';
    const actorId = (session as any)?.id || (session as any)?.user?.id || 'admin';
    const actorRole = (session as any)?.role || 'ADMIN';
    const body = await request.json().catch(() => ({}));
    const { pickupDate, pickupTime, pickupLocation, orderIds, force } = body;

    const result = await scheduleDailyDelhiveryPickup({
      pickupDate,
      pickupTime,
      pickupLocation,
      orderIds: Array.isArray(orderIds) ? orderIds : undefined,
      force: Boolean(force),
    });

    if (result.success) {
      await createAuditLogEntry({
        actorId,
        actorEmail,
        actorRole,
        action: 'DELHIVERY_PICKUP_REQUESTED',
        resource: 'Shipping',
        diff: {
          count: result.count,
          pickupId: result.pickupId,
          pickupDate: result.pickupDate,
          pickupTime: result.pickupTime,
        },
        status: 'SUCCESS',
        request,
      });

      return NextResponse.json({
        success: true,
        pickupId: result.pickupId,
        count: result.count,
        pickupDate: result.pickupDate,
        pickupTime: result.pickupTime,
        message: result.message,
      });
    } else {
      await createAuditLogEntry({
        actorId,
        actorEmail,
        actorRole,
        action: 'DELHIVERY_PICKUP_FAILED',
        resource: 'Shipping',
        diff: { error: result.error, count: result.count },
        status: 'FAILURE',
        request,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || result.message || 'Failed to schedule Delhivery pickup',
          count: result.count,
          pickupDate: result.pickupDate,
          pickupTime: result.pickupTime,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error('admin.shipping.request_pickup_fatal', { error: error?.message });
    return NextResponse.json(
      { error: error?.message || 'Failed to request pickup from Delhivery' },
      { status: 500 }
    );
  }
}
