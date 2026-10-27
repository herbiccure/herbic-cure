import 'server-only';
import { prisma } from '@/lib/prisma';
import {
  createDelhiveryPendingOrder,
  createDelhiveryShipment,
  pollDelhiveryOrderByRefIds,
  DelhiveryShipmentOrder,
} from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export type EffectiveShippingMode = 'delhivery_pending' | 'auto_manifest';

/**
 * Retrieves the effective logistics shipping mode from store settings or environment.
 * Default is 'auto_manifest' so existing live store behavior remains untouched
 * until the merchant explicitly switches SHIPPING_MODE to 'delhivery_pending'.
 */
export async function getEffectiveShippingMode(): Promise<EffectiveShippingMode> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'shipping_mode' },
    });
    if (setting?.value === 'delhivery_pending' || process.env.SHIPPING_MODE === 'delhivery_pending') {
      return 'delhivery_pending';
    }
    return 'auto_manifest';
  } catch (err: any) {
    logger.warn('shipping.mode.read_failed', { error: err?.message });
    return 'auto_manifest';
  }
}

export interface SendToPendingResult {
  success: boolean;
  status: 'PENDING' | 'MANIFESTED' | 'FAILED' | 'SKIPPED';
  waybill?: string;
  message?: string;
  error?: string;
}

/**
 * Sends a confirmed order to Delhivery One.
 * - In 'delhivery_pending' mode: Stages the order in Delhivery One Pending queue (unmanifested, ₹0 charged).
 * - In 'auto_manifest' mode: Immediately manifests and generates AWB.
 * Idempotent: Skips if order already has an active AWB or has already been successfully staged.
 */
export async function sendOrderToDelhiveryPending(
  orderId: string
): Promise<SendToPendingResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    logger.warn('shipping.delhivery_pending.order_not_found', { orderId });
    return {
      success: false,
      status: 'FAILED',
      error: 'Order not found',
    };
  }

  // Idempotency: Skip cancelled orders
  if (order.orderStatus === 'CANCELLED') {
    return {
      success: true,
      status: 'SKIPPED',
      message: 'Order is cancelled. Skipping Delhivery staging.',
    };
  }

  // Idempotency: Already has an active AWB
  if (order.trackingNumber && !order.trackingNumber.startsWith('DLH')) {
    return {
      success: true,
      status: 'MANIFESTED',
      waybill: order.trackingNumber,
      message: `Order #${order.orderNumber} already has AWB #${order.trackingNumber}`,
    };
  }

  // Idempotency: Already successfully staged and awaiting warehouse verification
  const ord = order as any;
  if (
    ord.delhiverySyncStatus === 'SYNCED' &&
    ord.delhiveryStatus === 'PENDING' &&
    ord.shippingMode === 'delhivery_pending'
  ) {
    return {
      success: true,
      status: 'PENDING',
      message: `Order #${order.orderNumber} is already staged in Delhivery One Pending queue`,
    };
  }

  // Atomic concurrency guard: prevent duplicate concurrent calls from staging or manifesting twice
  // (e.g. razorpay verify and webhook running simultaneously)
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
    logger.info('shipping.delhivery.sync_already_in_progress', {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
    return {
      success: true,
      status: 'SKIPPED',
      message: 'Order Delhivery sync is already in progress or completed.',
    };
  }

  try {
    // Determine effective fulfillment mode
    const shippingMode = await getEffectiveShippingMode();

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
      // Keep fallback
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
      items: order.items.map((it) => ({
        name: it.productName,
        productName: it.productName,
        sku: it.productId || it.productName,
        quantity: it.quantity,
        price: it.price,
      })),
    };

    // Branch based on configured shipping mode
    if (shippingMode === 'auto_manifest') {
      // Direct Manifestation
      const manifestRes = await createDelhiveryShipment(shipmentPayload);
      if (manifestRes.success && manifestRes.waybill) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            trackingNumber: manifestRes.waybill,
            trackingUrl: manifestRes.trackingUrl,
            carrier: 'Delhivery',
            delhiveryStatus: 'MANIFESTED',
            delhiverySyncStatus: 'SYNCED',
            delhiverySyncError: null,
            shippingMode: 'auto_manifest',
            lastDelhiverySyncAt: new Date(),
          } as any,
        });

        await prisma.shipmentEvent.create({
          data: {
            orderId: order.id,
            status: 'READY_TO_SHIP',
            location: 'Delhivery Logistics Hub',
            description: `Shipment auto-manifested with Delhivery. AWB: ${manifestRes.waybill}`,
          },
        });

        logger.info('shipping.delhivery.auto_manifested', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          waybill: manifestRes.waybill,
        });

        return {
          success: true,
          status: 'MANIFESTED',
          waybill: manifestRes.waybill,
          message: manifestRes.message,
        };
      } else {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            delhiverySyncStatus: 'FAILED',
            delhiverySyncError: manifestRes.message || 'Auto-manifest failed',
            shippingMode: 'auto_manifest',
            delhiverySyncAttempts: { increment: 1 },
            lastDelhiverySyncAt: new Date(),
          } as any,
        });

        logger.warn('shipping.delhivery.auto_manifest_failed', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          error: manifestRes.message,
        });

        return {
          success: false,
          status: 'FAILED',
          error: manifestRes.message || 'Auto-manifest failed',
        };
      }
    }

    // Recommended: Delhivery Pending Queue Mode (Unmanifested, ₹0 charged)
    const pendingRes = await createDelhiveryPendingOrder(shipmentPayload);

    if (pendingRes.success) {
      // Normal Pending Mode: Order staged in Store Pending queue (₹0 charged)
      await prisma.order.update({
        where: { id: order.id },
        data: {
          delhiveryStatus: 'PENDING',
          delhiverySyncStatus: 'SYNCED',
          delhiverySyncError: null,
          shippingMode: 'delhivery_pending',
          lastDelhiverySyncAt: new Date(),
        } as any,
      });

      await prisma.shipmentEvent.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          location: 'Delhivery One (Pending Queue)',
          description: 'Order staged in Delhivery One Pending queue (unmanifested, ₹0 charged). Awaiting warehouse verification and manifestation.',
        },
      });

      logger.info('shipping.delhivery_pending.staged', {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      return {
        success: true,
        status: 'PENDING',
        message: 'Order staged in Delhivery One Pending queue. Awaiting staff verification (₹0 charged).',
      };
    }

    // Pending creation failed
    const errorMsg = pendingRes.message || 'Failed to stage order in Delhivery Pending queue';
    await prisma.order.update({
      where: { id: order.id },
      data: {
        delhiverySyncStatus: 'FAILED',
        delhiverySyncError: errorMsg,
        shippingMode: 'delhivery_pending',
        delhiverySyncAttempts: { increment: 1 },
        lastDelhiverySyncAt: new Date(),
      } as any,
    });

    logger.warn('shipping.delhivery_pending.failed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      error: errorMsg,
    });

    return {
      success: false,
      status: 'FAILED',
      error: errorMsg,
    };
  } catch (err: any) {
    logger.error('shipping.delhivery_pending.exception', {
      orderId: order.id,
      error: err?.message,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: {
        delhiverySyncStatus: 'FAILED',
        delhiverySyncError: err?.message || 'Unexpected exception during Delhivery sync',
        lastDelhiverySyncAt: new Date(),
      } as any,
    }).catch(() => {});
    return {
      success: false,
      status: 'FAILED',
      error: err?.message || 'Unexpected exception during Delhivery sync',
    };
  }
}

/**
 * Discovers AWB for an unmanifested order by querying Delhivery tracking API with order number
 */
export async function syncOrderFromDelhiveryRefId(orderId: string): Promise<{
  success: boolean;
  discoveredAwb?: string;
  isPending: boolean;
  message: string;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return { success: false, isPending: false, message: 'Order not found' };
  }

  const lookup = await pollDelhiveryOrderByRefIds([order.orderNumber]);
  const pkg = lookup.packages.find((p) => p.orderNumber === order.orderNumber) || lookup.packages[0];

  if (pkg && pkg.waybill) {
    // AWB was generated in Delhivery One!
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: pkg.waybill,
        trackingUrl: `https://www.delhivery.com/track/package/${pkg.waybill}`,
        carrier: 'Delhivery',
        delhiveryStatus: 'MANIFESTED',
        delhiverySyncStatus: 'SYNCED',
        lastDelhiverySyncAt: new Date(),
      } as any,
    });

    await prisma.shipmentEvent.create({
      data: {
        orderId: order.id,
        status: 'READY_TO_SHIP',
        location: 'Delhivery One Dashboard',
        description: `AWB discovered from Delhivery One: ${pkg.waybill}. Order manifested and awaiting courier pickup.`,
      },
    });

    logger.info('shipping.delhivery_pending.awb_discovered', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      waybill: pkg.waybill,
    });

    return {
      success: true,
      discoveredAwb: pkg.waybill,
      isPending: false,
      message: `Discovered active AWB #${pkg.waybill} from Delhivery One`,
    };
  }

  // Not manifested yet, but remains in pending queue
  await prisma.order.update({
    where: { id: order.id },
    data: {
      lastDelhiverySyncAt: new Date(),
      delhiveryStatus: 'PENDING',
    } as any,
  });

  return {
    success: true,
    isPending: true,
    message: 'Order is staged in Delhivery One Pending queue. Staff verification in progress.',
  };
}
