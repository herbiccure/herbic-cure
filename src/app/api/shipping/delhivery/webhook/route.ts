import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cancelOrderWithLogistics } from '@/lib/shipping/orderCancellation';
import { mapDelhiveryStatusToOrderStatus } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Delhivery Tracking & Shipment Status Push Webhook
 * Automatically syncs cancellations made in Delhivery panel into Admin > Orders
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => null);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        const rawData = formData.get('data') || formData.get('Shipment');
        if (typeof rawData === 'string') {
          try {
            body = JSON.parse(rawData);
          } catch {
            body = Object.fromEntries(formData.entries());
          }
        } else {
          body = Object.fromEntries(formData.entries());
        }
      }
    } else {
      body = await request.json().catch(() => null);
    }

    if (!body) {
      return NextResponse.json({ error: 'Empty or invalid webhook payload' }, { status: 400 });
    }

    // Normalize incoming payload which can be an array or a single object or nested under Shipment
    const rawShipments = Array.isArray(body)
      ? body
      : body.shipments || body.Shipments || body.packages || [body];

    logger.info('shipping.webhook.received', {
      packageCount: rawShipments.length,
    });

    const results: Array<{ orderNumber?: string; waybill?: string; action: string; message: string }> = [];

    for (const raw of rawShipments) {
      const shipment = raw.Shipment || raw;
      const waybill = (
        shipment.AWB ||
        shipment.waybill ||
        shipment.wbn ||
        shipment.awb ||
        raw.waybill ||
        raw.AWB ||
        ''
      ).toString().trim();

      const orderNumber = (
        shipment.ReferenceNo ||
        shipment.reference_no ||
        shipment.order ||
        shipment.order_id ||
        shipment.orderNumber ||
        raw.ReferenceNo ||
        raw.order ||
        ''
      ).toString().trim();

      const status = (
        shipment.Status?.Status ||
        shipment.status ||
        shipment.Status ||
        shipment.Scan ||
        raw.status ||
        ''
      ).toString().trim();

      const scans = shipment.Scans || shipment.scans || [];
      const instructions = shipment.Status?.Instructions || shipment.instructions || shipment.reason || '';

      // Locate the order in the database
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            ...(waybill ? [{ trackingNumber: waybill }] : []),
            ...(orderNumber ? [{ orderNumber: orderNumber }] : []),
          ],
        },
      });

      if (!order) {
        results.push({
          waybill,
          orderNumber,
          action: 'ORDER_NOT_FOUND',
          message: `No matching order found for AWB: ${waybill || 'N/A'}, Order: ${orderNumber || 'N/A'}`,
        });
        continue;
      }

      const mapped = mapDelhiveryStatusToOrderStatus(status, scans);

      // 1. Cancellation / RTO Handling
      if (mapped.isCancelled) {
        if (order.orderStatus === 'CANCELLED') {
          results.push({
            orderNumber: order.orderNumber,
            waybill: order.trackingNumber || waybill,
            action: 'ALREADY_CANCELLED',
            message: `Order ${order.orderNumber} is already marked CANCELLED`,
          });
          continue;
        }

        const cancelReason = instructions
          ? `Shipment cancelled in Delhivery: ${instructions}`
          : 'Shipment cancelled in Delhivery network';

        const cancelResult = await cancelOrderWithLogistics({
          orderId: order.id,
          reason: cancelReason,
          cancelledBy: 'SYSTEM',
        });

        results.push({
          orderNumber: order.orderNumber,
          waybill: order.trackingNumber || waybill,
          action: 'CANCELLED_IN_ADMIN',
          message: cancelResult.message,
        });
        continue;
      }

      // 2. Delivered
      if (mapped.isDelivered) {
        if (order.orderStatus !== 'DELIVERED') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'DELIVERED',
              pickupStatus: 'PICKED',
              ...(order.paymentMethod === 'COD' ? { paymentStatus: 'PAID' } : {}),
            },
          });

          await prisma.shipmentEvent.create({
            data: {
              orderId: order.id,
              status: 'DELIVERED',
              location: 'Customer Address',
              description: instructions || mapped.description || 'Package delivered successfully by Delhivery',
            },
          });
        }

        results.push({
          orderNumber: order.orderNumber,
          waybill: order.trackingNumber || waybill,
          action: 'DELIVERED',
          message: `Order #${order.orderNumber} updated to DELIVERED`,
        });
        continue;
      }

      // 3. Out for Delivery
      if (mapped.orderStatus === 'OUT_FOR_DELIVERY') {
        if (order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'OUT_FOR_DELIVERY') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'OUT_FOR_DELIVERY',
              pickupStatus: 'PICKED',
            },
          });

          await prisma.shipmentEvent.create({
            data: {
              orderId: order.id,
              status: 'OUT_FOR_DELIVERY',
              location: 'Local Delivery Hub',
              description: instructions || mapped.description || 'Package out for delivery with Delhivery rider',
            },
          });
        }

        results.push({
          orderNumber: order.orderNumber,
          waybill: order.trackingNumber || waybill,
          action: 'OUT_FOR_DELIVERY',
          message: `Order #${order.orderNumber} updated to OUT_FOR_DELIVERY`,
        });
        continue;
      }

      // 4. In Transit / Picked Up
      if (mapped.orderStatus === 'SHIPPED') {
        const allowedPreviousStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'];
        if (allowedPreviousStatuses.includes(order.orderStatus)) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'SHIPPED',
              pickupStatus: 'PICKED',
            },
          });

          await prisma.shipmentEvent.create({
            data: {
              orderId: order.id,
              status: 'SHIPPED',
              location: 'Delhivery Transit Center',
              description: instructions || mapped.description || 'Package picked up by Delhivery and in transit',
            },
          });
        }

        results.push({
          orderNumber: order.orderNumber,
          waybill: order.trackingNumber || waybill,
          action: 'SHIPPED',
          message: `Order #${order.orderNumber} updated to SHIPPED`,
        });
        continue;
      }

      // 5. Pickup Scheduled ("Add to Pickup" in Delhivery One)
      if (mapped.pickupStatus === 'SCHEDULED') {
        if (order.pickupStatus !== 'SCHEDULED' && order.pickupStatus !== 'PICKED') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              pickupStatus: 'SCHEDULED',
            },
          });

          await prisma.shipmentEvent.create({
            data: {
              orderId: order.id,
              status: 'PROCESSING',
              location: 'Warehouse',
              description: 'Pickup scheduled in Delhivery One',
            },
          });
        }

        results.push({
          orderNumber: order.orderNumber,
          waybill: order.trackingNumber || waybill,
          action: 'PICKUP_SCHEDULED',
          message: `Order #${order.orderNumber} pickup status updated to SCHEDULED`,
        });
        continue;
      }

      // Unhandled or informational scan
      results.push({
        waybill,
        orderNumber,
        action: 'PROCESSED_INFORMATIONAL',
        message: `Status "${status}" recorded without lifecycle state transition`,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
    });
  } catch (error: any) {
    logger.error('shipping.webhook.failed', { error: error?.message || 'Internal webhook error' });
    return NextResponse.json(
      { error: error?.message || 'Internal webhook error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Delhivery Tracking & Status Webhook Listener',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
  });
}
