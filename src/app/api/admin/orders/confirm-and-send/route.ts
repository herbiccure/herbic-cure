import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { createAuditLogEntry } from '@/data/admin/audit';
import {
  createDelhiveryShipment,
  DelhiveryShipmentOrder,
  scheduleDailyDelhiveryPickup,
} from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface ConfirmAndSendResult {
  orderId: string;
  orderNumber: string;
  success: boolean;
  waybill?: string;
  trackingUrl?: string;
  error?: string;
  message?: string;
}

/**
 * POST /api/admin/orders/confirm-and-send
 * Single or Bulk confirmation and direct dispatch to Delhivery Express.
 * Idempotent, audited, permission-checked server-side.
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

    // Support both single orderId and bulk orderIds array
    let orderIds: string[] = [];
    if (Array.isArray(body.orderIds) && body.orderIds.length > 0) {
      orderIds = body.orderIds.filter(Boolean);
    } else if (body.orderId) {
      orderIds = [body.orderId];
    }

    if (orderIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one orderId or orderIds array is required' },
        { status: 400 }
      );
    }

    const results: ConfirmAndSendResult[] = [];

    for (const orderId of orderIds) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!order) {
        results.push({
          orderId,
          orderNumber: 'UNKNOWN',
          success: false,
          error: 'Order not found',
        });
        continue;
      }

      // Check if order is already cancelled
      if (order.orderStatus === 'CANCELLED') {
        results.push({
          orderId,
          orderNumber: order.orderNumber,
          success: false,
          error: 'Cannot confirm or send a cancelled order',
        });
        continue;
      }

      // Idempotency: Already has an active AWB
      if (order.trackingNumber && !order.trackingNumber.startsWith('DLH')) {
        results.push({
          orderId,
          orderNumber: order.orderNumber,
          success: true,
          waybill: order.trackingNumber,
          trackingUrl: order.trackingUrl || undefined,
          message: `Order #${order.orderNumber} is already manifested with AWB ${order.trackingNumber}`,
        });
        continue;
      }

      // Atomic Concurrency Guard: Lock order to IN_PROGRESS
      const claim = await prisma.order.updateMany({
        where: {
          id: order.id,
          trackingNumber: null,
          delhiverySyncStatus: { not: 'IN_PROGRESS' },
        },
        data: {
          delhiverySyncStatus: 'IN_PROGRESS',
          lastDelhiverySyncAt: new Date(),
        } as any,
      });

      if (claim.count === 0) {
        results.push({
          orderId,
          orderNumber: order.orderNumber,
          success: false,
          error: 'Manifestation already in progress or order already manifested',
        });
        continue;
      }

      try {
        // Parse destination address
        let destAddress = order.shippingAddress;
        let city = '';
        let state = '';
        let pincode = '';

        try {
          const trimmed = (order.shippingAddress || '').trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const parsed = JSON.parse(trimmed);
            destAddress = parsed.address || parsed.addressLine1 || order.shippingAddress;
            if (parsed.addressLine2) destAddress = `${destAddress}, ${parsed.addressLine2}`;
            city = parsed.city || '';
            state = parsed.state || '';
            pincode = (parsed.pinCode || parsed.pincode || '').replace(/\D/g, '');
          }
        } catch {
          // Keep raw address
        }

        const isCod = order.paymentMethod === 'COD';
        const orderAdv = Number((order as any).advanceAmount ?? 0);
        const effectiveCodBalance = Number(
          (order as any).codBalanceAmount ?? (order.total - orderAdv)
        );

        const shipmentPayload: DelhiveryShipmentOrder = {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          customerAddress: destAddress,
          city,
          state,
          pincode,
          totalAmount: order.total,
          shippingFee: order.shippingFee,
          codBalanceAmount: isCod ? effectiveCodBalance : 0,
          paymentMethod: isCod ? 'COD' : 'Prepaid',
          items: order.items.map((it: any) => ({
            name: it.productName,
            productName: it.productName,
            labelName: it.product?.labelName || null,
            sku: it.product?.sku || it.productId || 'HC-PROD',
            quantity: it.quantity,
            price: it.price,
            product: it.product,
          })),
        };

        const manifestRes = await createDelhiveryShipment(shipmentPayload);

        if (manifestRes.success && manifestRes.waybill) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              trackingNumber: manifestRes.waybill,
              trackingUrl: manifestRes.trackingUrl,
              carrier: 'Delhivery',
              delhiveryStatus: 'MANIFESTED',
              orderStatus: 'READY_TO_SHIP',
              delhiverySyncStatus: 'SYNCED',
              delhiverySyncError: null,
              lastDelhiverySyncAt: new Date(),
            } as any,
          });

          await prisma.shipmentEvent.create({
            data: {
              orderId: order.id,
              status: 'READY_TO_SHIP',
              location: 'Delhivery Logistics Hub',
              description: `Order confirmed by staff (${actorEmail}) and manifested with Delhivery. AWB: ${manifestRes.waybill}`,
            },
          });

          await createAuditLogEntry({
            actorId,
            actorEmail,
            actorRole,
            action: 'ORDER_CONFIRMED_AND_MANIFESTED',
            resource: 'Order',
            resourceId: order.id,
            diff: {
              orderNumber: order.orderNumber,
              waybill: manifestRes.waybill,
              codBalance: isCod ? effectiveCodBalance : 0,
              mode: 'confirm_then_send',
            },
            status: 'SUCCESS',
            request,
          });

          logger.info('shipping.delhivery.confirmed_and_manifested', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            waybill: manifestRes.waybill,
            confirmedBy: actorEmail,
          });

          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            success: true,
            waybill: manifestRes.waybill,
            trackingUrl: manifestRes.trackingUrl,
            message: `Manifested with AWB #${manifestRes.waybill}`,
          });
        } else {
          const errMsg = manifestRes.message || 'Manifestation rejected by Delhivery';
          await prisma.order.update({
            where: { id: order.id },
            data: {
              delhiverySyncStatus: 'FAILED',
              delhiverySyncError: errMsg,
              delhiverySyncAttempts: { increment: 1 },
              lastDelhiverySyncAt: new Date(),
            } as any,
          });

          await createAuditLogEntry({
            actorId,
            actorEmail,
            actorRole,
            action: 'ORDER_CONFIRM_FAILED',
            resource: 'Order',
            resourceId: order.id,
            diff: {
              orderNumber: order.orderNumber,
              error: errMsg,
            },
            status: 'FAILURE',
            request,
          });

          logger.warn('shipping.delhivery.confirm_failed', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            error: errMsg,
          });

          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            success: false,
            error: errMsg,
          });
        }
      } catch (err: any) {
        logger.error('shipping.delhivery.confirm_exception', {
          orderId: order.id,
          error: err?.message,
        });
        await prisma.order.update({
          where: { id: order.id },
          data: {
            delhiverySyncStatus: 'FAILED',
            delhiverySyncError: err?.message || 'Exception during manifestation',
            delhiverySyncAttempts: { increment: 1 },
            lastDelhiverySyncAt: new Date(),
          } as any,
        }).catch(() => {});

        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: err?.message || 'Exception during manifestation',
        });
      }
    }

    // Check if auto pickup should be triggered for any newly manifested orders
    const successfulManifestCount = results.filter((r) => r.success && r.waybill).length;
    if (successfulManifestCount > 0) {
      try {
        const pickupSetting = await prisma.siteSetting.findUnique({
          where: { key: 'pickup_mode' },
        });
        if (pickupSetting?.value === 'auto' || process.env.PICKUP_MODE === 'auto') {
          scheduleDailyDelhiveryPickup().catch(() => {});
        }
      } catch {}
    }

    const allSuccessful = results.every((r) => r.success);
    const someSuccessful = results.some((r) => r.success);

    return NextResponse.json({
      success: allSuccessful,
      partial: !allSuccessful && someSuccessful,
      results,
      summary: `${results.filter((r) => r.success).length} of ${results.length} order(s) confirmed and sent to Delhivery.`,
    });
  } catch (error: any) {
    logger.error('admin.order.confirm_and_send_fatal', { error: error?.message });
    return NextResponse.json(
      { error: error?.message || 'Failed to process confirmation and dispatch' },
      { status: 500 }
    );
  }
}
