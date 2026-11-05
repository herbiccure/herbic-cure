import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { getPickupLocation } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/[\r\n]+/g, ' ').trim().replace(/"/g, '""');
  if (str.includes(',') || str.includes('"')) {
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
      orderStatus: { in: ['READY_TO_SHIP', 'CONFIRMED', 'PROCESSING'] },
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

    // Official Delhivery One Forward Order Bulk Upload 41-Column Template
    const headers = [
      '*Sale Order Number',
      '*Pickup Location Name',
      '*Transport Mode',
      '*Payment Mode',
      'COD Amount',
      '*Customer Name',
      '*Customer Phone',
      '*Shipping Address Line1',
      'Shipping Address Line2',
      '*Shipping City',
      '*Shipping State',
      '*Shipping Pincode',
      '*Item Sku Code',
      '*Item Sku Name',
      '*Quantity Ordered',
      'Packaging Type',
      '*Unit Item Price',
      'Length (cm)',
      'Breadth (cm)',
      'Height (cm)',
      'Weight (gm)',
      'Fragile Shipment',
      'Discount Type',
      'Discount Value',
      'Tax Class Code',
      'Customer Email',
      'Billing Address same as Shipping Address',
      'Billing Address Line1',
      'Billing Address Line2',
      'Billing City',
      'Billing State',
      'Billing Pincode',
      'e-Way Bill Number',
      'Seller Name',
      'Seller GST Number',
      'Seller Address Line1',
      'Seller Address Line2',
      'Seller City',
      'Seller State',
      'Seller Pincode',
      'Select NDD',
    ];

    const rows: string[] = [headers.join(',')];
    const pickupLoc = getPickupLocation();
    const exportedOrderIds: string[] = [];

    for (const order of orders) {
      exportedOrderIds.push(order.id);

      // Parse Address details safely
      let destAddress = 'Customer Address';
      let destAddress2 = '';
      let city = 'Destination';
      let state = 'State';
      let pincode = '';
      let customerPhone = (order.customerPhone || '').replace(/\D/g, '');

      try {
        const rawAddr = (order.shippingAddress || '').trim();
        if (rawAddr.startsWith('{') && rawAddr.endsWith('}')) {
          const parsed = JSON.parse(rawAddr);
          destAddress = (parsed.address || parsed.addressLine1 || rawAddr).replace(/[\r\n]+/g, ' ').trim();
          destAddress2 = (parsed.addressLine2 || '').replace(/[\r\n]+/g, ' ').trim();
          city = (parsed.city || city).replace(/[\r\n]+/g, ' ').trim();
          state = (parsed.state || state).replace(/[\r\n]+/g, ' ').trim();
          pincode = (parsed.pinCode || parsed.pincode || parsed.postalCode || '').replace(/\D/g, '');
          if (!customerPhone && (parsed.phone || parsed.mobile)) {
            customerPhone = String(parsed.phone || parsed.mobile).replace(/\D/g, '');
          }
        } else if (rawAddr) {
          destAddress = rawAddr.replace(/[\r\n]+/g, ' ').trim();
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
      const cleanPhone = customerPhone.length >= 10 ? customerPhone.slice(-10) : customerPhone;
      const cleanCustomerName = (order.customerName || 'Customer').replace(/[\r\n]+/g, ' ').trim();

      const itemsToExport = order.items && order.items.length > 0 ? order.items : [
        {
          id: 'item-default',
          orderId: order.id,
          productId: 'HC-PROD',
          productName: 'Herbic Cure Ayurvedic Product',
          quantity: 1,
          price: order.total,
          product: null,
        } as any,
      ];

      // Multi-SKU: Repeat same Order ID across consecutive rows for each product
      for (const it of itemsToExport) {
        let skuCode = it.product?.sku || it.productId || 'HC-PROD';
        if (skuCode === 'HC-COMBO-OIL-SHMP') skuCode = 'HC-HO-S';
        if (skuCode === 'HC-COMB-01') skuCode = 'HC-CO-1';
        if (!skuCode || skuCode.length > 25) {
          const lower = (it.productName || '').toLowerCase();
          if (lower.includes('oil') && lower.includes('shampoo') && lower.includes('comb')) {
            skuCode = 'HC-TRIO-01';
          } else if (lower.includes('oil') && lower.includes('shampoo')) {
            skuCode = 'HC-HO-S';
          } else if (lower.includes('oil') && lower.includes('comb')) {
            skuCode = 'HC-OIL-COMB';
          } else if (lower.includes('shampoo')) {
            skuCode = 'HC-SHMP-Q1';
          } else if (lower.includes('comb')) {
            skuCode = 'HC-CO-1';
          } else {
            skuCode = 'HC-OIL-Q1';
          }
        }

        const rawName = it.productName || it.product?.name || 'Herbic Cure Ayurvedic Product';
        const cleanItemName = rawName
          .replace(/,\s*delivery\s*rs\s*\d+/gi, '')
          .replace(/\s*x\d+$/i, '')
          .replace(/[\r\n]+/g, ' ')
          .trim();

        const row = [
          escapeCsvField(order.orderNumber),
          escapeCsvField(pickupLoc),
          escapeCsvField('Surface'),
          escapeCsvField(isCod ? 'COD' : 'Prepaid'),
          escapeCsvField(codAmountVal),
          escapeCsvField(cleanCustomerName),
          escapeCsvField(cleanPhone),
          escapeCsvField(destAddress),
          escapeCsvField(destAddress2),
          escapeCsvField(city),
          escapeCsvField(state),
          escapeCsvField(pincode),
          escapeCsvField(skuCode),
          escapeCsvField(cleanItemName),
          escapeCsvField(Math.max(1, Math.round(it.quantity || 1))),
          escapeCsvField('Box'),
          escapeCsvField(Number(it.price || 0).toFixed(2)),
          escapeCsvField(15),
          escapeCsvField(10),
          escapeCsvField(5),
          escapeCsvField(500),
          escapeCsvField('No'),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(order.customerEmail || ''),
          escapeCsvField('Yes'),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField('No'),
        ];
        rows.push(row.join(','));
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
      }).catch(() => { });
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

