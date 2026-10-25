import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cancelOrderWithLogistics } from '@/lib/shipping/orderCancellation';
import { isDelhiveryCancelled } from '@/lib/shipping/delhivery';
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

      const isCancelled = isDelhiveryCancelled(status, scans);

      if (!isCancelled) {
        results.push({
          waybill,
          orderNumber,
          action: 'IGNORED',
          message: `Status "${status}" is not a cancellation event`,
        });
        continue;
      }

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

      if (order.orderStatus === 'CANCELLED') {
        results.push({
          orderNumber: order.orderNumber,
          waybill: order.trackingNumber || waybill,
          action: 'ALREADY_CANCELLED',
          message: `Order ${order.orderNumber} is already marked CANCELLED`,
        });
        continue;
      }

      // Execute central order cancellation with inventory restock and ShipmentEvent audit log
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
