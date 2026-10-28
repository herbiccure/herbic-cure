import { prisma } from '@/lib/prisma';
import { cancelDelhiveryShipment, DelhiveryCancelResult } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export interface CancelOrderResult {
  success: boolean;
  orderNumber: string;
  orderStatus: string;
  message: string;
  delhivery?: DelhiveryCancelResult;
  restockedItemsCount: number;
}

/**
 * Centrally cancels an order and dispatches the cancellation call to Delhivery Logistics
 * Restocks products atomically and logs an audit ShipmentEvent
 */
export async function cancelOrderWithLogistics({
  orderId,
  reason,
  cancelledBy,
}: {
  orderId: string;
  reason?: string;
  cancelledBy: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
}): Promise<CancelOrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.orderStatus === 'CANCELLED') {
    return {
      success: true,
      orderNumber: order.orderNumber,
      orderStatus: 'CANCELLED',
      message: 'Order is already cancelled',
      restockedItemsCount: 0,
    };
  }

  if (order.orderStatus === 'DELIVERED') {
    throw new Error('Cannot cancel an order that has already been delivered. Please initiate a return instead.');
  }

  // 1. Dispatch cancellation to Delhivery if a waybill / tracking number exists
  let delhiveryResult: DelhiveryCancelResult | undefined;
  if (order.trackingNumber) {
    try {
      delhiveryResult = await cancelDelhiveryShipment(order.trackingNumber, reason);
    } catch (err: any) {
      logger.warn('shipping.cancellation.service_warning', { error: err.message, orderId });
      delhiveryResult = {
        success: false,
        waybill: order.trackingNumber,
        status: 'FAILED',
        message: err?.message || 'Failed to communicate with Delhivery API',
      };
    }
  }

  // 2. Atomic Database Transaction: Update status + Restock Inventory + Log Audit Event
  let restockedCount = 0;
  await prisma.$transaction(async (tx) => {
    // A. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'CANCELLED',
      },
    });

    // B. Restock product quantities
    for (const item of order.items) {
      if (item.productId) {
        try {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
          restockedCount += item.quantity;
        } catch (stockErr: any) {
          logger.warn('order.restock.failed', { productId: item.productId, error: stockErr?.message });
        }
      }
    }

    // C. Flag refund for admin review if money was paid (prepaid or COD advance)
    const refundableAmount =
      order.paymentStatus === 'PAID'
        ? order.total
        : Number((order as any).advanceAmount || 0);

    if (refundableAmount > 0) {
      const existingRefund = await tx.refundRequest.findFirst({
        where: { orderId: order.id },
      });
      if (!existingRefund) {
        await tx.refundRequest.create({
          data: {
            orderId: order.id,
            amount: refundableAmount,
            reason: `Order cancelled (${cancelledBy}). Reason: ${reason || 'Shipment cancelled in Delhivery One'}`,
            status: 'PENDING',
            requestedBy: `SYSTEM (${cancelledBy})`,
          },
        });

        await tx.shipmentEvent.create({
          data: {
            orderId: order.id,
            status: 'REFUND_PENDING',
            location: 'Admin Refund Management',
            description: `Refund of ₹${refundableAmount.toLocaleString('en-IN')} flagged for admin review due to order cancellation.`,
          },
        });
      }
    }

    // D. Create ShipmentEvent entry for tracking history
    const delhiveryNotice = delhiveryResult?.waybill
      ? ` | Delhivery AWB: ${delhiveryResult.waybill} (${delhiveryResult.message})`
      : '';
    const reasonNotice = reason ? ` Reason: ${reason}` : '';

    await tx.shipmentEvent.create({
      data: {
        orderId: order.id,
        status: 'CANCELLED',
        description: `Order cancelled by ${cancelledBy}.${reasonNotice}${delhiveryNotice}`,
        location: 'Delhivery Logistics Center',
      },
    });
  });

  logger.info('order.cancelled', {
    orderId,
    orderNumber: order.orderNumber,
    restockedItemsCount: restockedCount,
    cancelledBy,
  });

  return {
    success: true,
    orderNumber: order.orderNumber,
    orderStatus: 'CANCELLED',
    message: `Order ${order.orderNumber} cancelled successfully.${delhiveryResult?.message ? ` ${delhiveryResult.message}` : ''}`,
    delhivery: delhiveryResult,
    restockedItemsCount: restockedCount,
  };
}
