import 'server-only';
import { prisma } from '@/lib/prisma';
import {
  createDelhiveryShipment,
  pollDelhiveryOrderByRefIds,
  DelhiveryShipmentOrder,
  scheduleDailyDelhiveryPickup,
} from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export type EffectiveShippingMode = 'confirm_then_send' | 'delhivery_pending' | 'auto_manifest';

/**
 * Retrieves the effective logistics shipping mode from store settings or environment.
 * Default is 'auto_manifest' so existing live store behavior remains untouched
 * until the merchant explicitly switches SHIPPING_MODE to 'confirm_then_send'.
 */
export async function getEffectiveShippingMode(): Promise<EffectiveShippingMode> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'shipping_mode' },
    });
    const val = setting?.value || process.env.SHIPPING_MODE;
    if (val === 'confirm_then_send') {
      return 'confirm_then_send';
    }
    if (val === 'delhivery_pending') {
      return 'delhivery_pending';
    }
    return 'auto_manifest';
  } catch (err: any) {
    logger.warn('shipping.mode.read_failed', { error: err?.message });
    return 'auto_manifest';
  }
}

/**
 * Checks if prepaid orders should be automatically confirmed without manual staff approval.
 */
export async function isAutoConfirmPrepaidEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'auto_confirm_prepaid' },
    });
    if (setting?.value === 'true' || process.env.AUTO_CONFIRM_PREPAID === 'true') {
      return true;
    }
    return false;
  } catch {
    return false;
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
 * Sends a newly placed or verified order through the fulfillment pipeline.
 * - In 'confirm_then_send' mode: Orders wait in 'Awaiting confirmation' state.
 *   If auto_confirm_prepaid is enabled and the order is prepaid, it automatically manifests.
 * - In 'auto_manifest' mode: Immediately manifests and generates Delhivery AWB.
 * Idempotent: Skips if order already has an active AWB or has already been manifested.
 */
export async function sendOrderToDelhiveryPending(
  orderId: string
): Promise<SendToPendingResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
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

  // Idempotency: Already awaiting confirmation in confirm_then_send mode
  const ord = order as any;
  if (
    ord.delhiveryStatus === 'AWAITING_CONFIRMATION' &&
    ord.shippingMode === 'confirm_then_send'
  ) {
    return {
      success: true,
      status: 'PENDING',
      message: `Order #${order.orderNumber} is already awaiting confirmation`,
    };
  }

  // Atomic concurrency guard: prevent duplicate concurrent calls from manifesting twice
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
    const isPrepaid = !isCod || effectiveCodBalance <= 0;

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

    // Branch 1: CONFIRM_THEN_SEND mode
    if (shippingMode === 'confirm_then_send') {
      const autoConfirmPrepaid = await isAutoConfirmPrepaidEnabled();

      // Check if auto-confirm prepaid is enabled for prepaid orders
      if (isPrepaid && autoConfirmPrepaid) {
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
              shippingMode: 'confirm_then_send',
              lastDelhiverySyncAt: new Date(),
            } as any,
          });

          await prisma.shipmentEvent.create({
            data: {
              orderId: order.id,
              status: 'READY_TO_SHIP',
              location: 'Delhivery Logistics Hub',
              description: `Prepaid order auto-confirmed and manifested with Delhivery. AWB: ${manifestRes.waybill}`,
            },
          });

          // Check if auto pickup is enabled
          try {
            const pickupSetting = await prisma.siteSetting.findUnique({ where: { key: 'pickup_mode' } });
            if (pickupSetting?.value === 'auto' || process.env.PICKUP_MODE === 'auto') {
              scheduleDailyDelhiveryPickup().catch(() => {});
            }
          } catch {}

          logger.info('shipping.delhivery.prepaid_auto_confirmed', {
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
              delhiverySyncError: manifestRes.message || 'Auto-manifest failed for prepaid order',
              shippingMode: 'confirm_then_send',
              delhiverySyncAttempts: { increment: 1 },
              lastDelhiverySyncAt: new Date(),
            } as any,
          });

          return {
            success: false,
            status: 'FAILED',
            error: manifestRes.message || 'Auto-manifest failed for prepaid order',
          };
        }
      }

      // Default in confirm_then_send: Wait for admin confirmation!
      // Do NOT send to Delhivery!
      await prisma.order.update({
        where: { id: order.id },
        data: {
          delhiveryStatus: 'AWAITING_CONFIRMATION',
          delhiverySyncStatus: 'PENDING_CONFIRMATION',
          shippingMode: 'confirm_then_send',
          lastDelhiverySyncAt: new Date(),
        } as any,
      });

      await prisma.shipmentEvent.create({
        data: {
          orderId: order.id,
          status: 'AWAITING_CONFIRMATION',
          location: 'Herbic Cure Warehouse',
          description: 'Order placed. Awaiting admin confirmation before sending to Delhivery.',
        },
      });

      logger.info('shipping.delhivery.awaiting_confirmation', {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      return {
        success: true,
        status: 'PENDING',
        message: 'Order received and awaiting admin confirmation before sending to Delhivery.',
      };
    }

    // Branch 2: AUTO_MANIFEST mode (Direct Manifestation)
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

      // Check if auto pickup is enabled
      try {
        const pickupSetting = await prisma.siteSetting.findUnique({ where: { key: 'pickup_mode' } });
        if (pickupSetting?.value === 'auto' || process.env.PICKUP_MODE === 'auto') {
          scheduleDailyDelhiveryPickup().catch(() => {});
        }
      } catch {}

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

  // Not manifested yet
  await prisma.order.update({
    where: { id: order.id },
    data: {
      lastDelhiverySyncAt: new Date(),
    } as any,
  });

  return {
    success: true,
    isPending: true,
    message: 'Order is awaiting manifestation.',
  };
}
