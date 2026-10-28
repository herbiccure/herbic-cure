import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { getPickupLocation } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str}"`;
  }
  return str;
}

/**
 * Official Delhivery One Forward Orders Bulk Upload Template CSV Export
 * GET /api/admin/orders/export-delhivery-csv
 * Allows warehouse staff to download an official bulk orders CSV ready to upload into:
 * Delhivery One > Orders > Forward Orders > Upload Bulk Orders
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request, [
      'OWNER',
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'STORE_MANAGER',
    ]);
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const orderIdsParam = searchParams.get('orderIds');

    let whereClause: any = {
      orderStatus: { in: ['CONFIRMED', 'PROCESSING'] },
      trackingNumber: null,
    };

    if (orderIdsParam) {
      const ids = orderIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        whereClause = { id: { in: ids } };
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No unmanifested orders available for Delhivery CSV export' },
        { status: 404 }
      );
    }

    // Official Delhivery One Forward Order CSV Headers
    const headers = [
      'Order ID',
      'Payment Mode',
      'COD Amount',
      'Order Date',
      'Shipping Mode',
      'Consignee Name',
      'Consignee Address',
      'Consignee Address 2',
      'City',
      'State',
      'Pin Code',
      'Phone',
      'Email',
      'Weight',
      'Length',
      'Breadth',
      'Height',
      'Product SKU Code',
      'Product Name',
      'Quantity',
      'Price',
      'Pickup Location Name',
    ];

    const rows: string[] = [headers.join(',')];
    const pickupLoc = getPickupLocation();
    const exportedOrderIds: string[] = [];

    for (const order of orders) {
      exportedOrderIds.push(order.id);

      // Parse Address details safely
      let destAddress = order.shippingAddress;
      let destAddress2 = '';
      let city = 'Destination';
      let state = 'State';
      let pincode = '';

      try {
        const trimmed = (order.shippingAddress || '').trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const parsed = JSON.parse(trimmed);
          destAddress = parsed.address || parsed.addressLine1 || order.shippingAddress;
          destAddress2 = parsed.addressLine2 || '';
          city = parsed.city || city;
          state = parsed.state || state;
          pincode = (parsed.pinCode || parsed.pincode || '').replace(/\D/g, '');
        }
      } catch {
        // Fallback
      }

      if (!pincode) {
        const match = (order.shippingAddress || '').match(/\b\d{6}\b/);
        pincode = match ? match[0] : '500081';
      }

      const isCod = order.paymentMethod === 'COD';
      const orderAdv = Number((order as any).advanceAmount ?? 0);
      const effectiveCodBalance = Number(
        (order as any).codBalanceAmount ?? (order.total - orderAdv)
      );
      const codAmountVal = isCod ? Math.max(0, Math.round(effectiveCodBalance)) : 0;
      const orderDateStr = order.createdAt.toISOString().split('T')[0];
      const cleanPhone = (order.customerPhone || '').replace(/\D/g, '').slice(-10);

      // Multi-SKU: Repeat same Order ID across consecutive rows for each product
      for (const it of order.items) {
        let skuCode = it.product?.sku || it.productId || 'HC-PROD';
        if (skuCode === 'HC-COMBO-OIL-SHMP') skuCode = 'HC-HO-S';

        const row = [
          escapeCsvField(order.orderNumber),
          escapeCsvField(isCod ? 'COD' : 'Prepaid'),
          escapeCsvField(codAmountVal),
          escapeCsvField(orderDateStr),
          escapeCsvField('Express'),
          escapeCsvField(order.customerName),
          escapeCsvField(destAddress),
          escapeCsvField(destAddress2),
          escapeCsvField(city),
          escapeCsvField(state),
          escapeCsvField(pincode),
          escapeCsvField(cleanPhone),
          escapeCsvField(order.customerEmail || ''),
          escapeCsvField(500),
          escapeCsvField(18),
          escapeCsvField(10),
          escapeCsvField(8),
          escapeCsvField(skuCode),
          escapeCsvField(it.productName),
          escapeCsvField(it.quantity),
          escapeCsvField(Number(it.price || 0).toFixed(2)),
          escapeCsvField(pickupLoc),
        ];
        rows.push(row.join(','));
      }

      // If order incurs delivery charges, add separate row matching Delhivery label format
      const deliveryCharge = Number(order.shippingFee || 0);
      if (deliveryCharge > 0) {
        const delRow = [
          escapeCsvField(order.orderNumber),
          escapeCsvField(isCod ? 'COD' : 'Prepaid'),
          escapeCsvField(codAmountVal),
          escapeCsvField(orderDateStr),
          escapeCsvField('Express'),
          escapeCsvField(order.customerName),
          escapeCsvField(destAddress),
          escapeCsvField(destAddress2),
          escapeCsvField(city),
          escapeCsvField(state),
          escapeCsvField(pincode),
          escapeCsvField(cleanPhone),
          escapeCsvField(order.customerEmail || ''),
          escapeCsvField(0),
          escapeCsvField(0),
          escapeCsvField(0),
          escapeCsvField(0),
          escapeCsvField('Del-Charges'),
          escapeCsvField('Delivery charges'),
          escapeCsvField(1),
          escapeCsvField(deliveryCharge.toFixed(2)),
          escapeCsvField(pickupLoc),
        ];
        rows.push(delRow.join(','));
      }
    }

    // Record audit event for exported orders
    const authUserEmail = (authCheck as any)?.email || 'admin@herbiccure.com';
    for (const ordId of exportedOrderIds) {
      await prisma.shipmentEvent.create({
        data: {
          orderId: ordId,
          status: 'EXPORTED_DELHIVERY',
          location: 'Delhivery One Bulk Upload',
          description: `Order exported in official Delhivery One Forward Orders bulk upload CSV template by ${authUserEmail}`,
        },
      }).catch(() => {});
    }

    logger.info('shipping.delhivery.bulk_csv_exported', {
      orderCount: exportedOrderIds.length,
      user: authUserEmail,
    });

    const csvContent = rows.join('\r\n');
    const filename = `delhivery-one-orders-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    logger.error('shipping.delhivery.bulk_csv_export_failed', { error: err?.message });
    return NextResponse.json(
      { error: err?.message || 'Failed to generate Delhivery One CSV export' },
      { status: 500 }
    );
  }
}

