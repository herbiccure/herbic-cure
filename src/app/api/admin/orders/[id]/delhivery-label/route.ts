import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { getApiKey, getPickupLocation } from '@/lib/shipping/delhivery';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await context.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    if (!order.trackingNumber) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>No Delhivery AWB - ${order.orderNumber}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fdf2f4; color: #4a1d24; text-align: center; }
    .card { background: white; border: 1px solid #f3c2cb; border-radius: 16px; padding: 32px; max-width: 450px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h2 { color: #8C3A4F; margin-top: 0; }
    p { color: #666; font-size: 14px; line-height: 1.5; }
    button { background: #8C3A4F; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Shipment Not Manifested</h2>
    <p>Order <strong>#${order.orderNumber}</strong> has not been manifested with Delhivery yet, so no official AWB has been allocated.</p>
    <p>Please return to the Admin Orders page and click <strong>"Confirm & Send to Delhivery"</strong> to generate the AWB shipping label.</p>
    <button onclick="window.close()">Close Window</button>
  </div>
</body>
</html>`,
        {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    const apiKey = getApiKey();
    const waybill = order.trackingNumber;

    // In live staging/production mode with Delhivery API credentials
    if (apiKey) {
      try {
        const baseUrl =
          process.env.DELHIVERY_BASE_URL ||
          (process.env.DELHIVERY_ENV === 'production'
            ? 'https://track.delhivery.com'
            : 'https://staging-express.delhivery.com');

        const delhiveryLabelUrl = `${baseUrl.replace(/\/+$/, '')}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&pdf=true`;

        const res = await fetch(delhiveryLabelUrl, {
          headers: {
            Authorization: `Token ${apiKey}`,
            Accept: 'application/pdf, text/html, */*',
          },
          signal: AbortSignal.timeout(10000),
        });

        const contentType = res.headers.get('content-type') || '';

        if (res.ok && contentType.includes('pdf')) {
          const pdfBuffer = await res.arrayBuffer();
          return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="delhivery-label-${waybill}.pdf"`,
            },
          });
        }
      } catch (err: any) {
        logger.warn('shipping.delhivery_label.proxy_exception', {
          orderNumber: order.orderNumber,
          error: err?.message,
        });
      }
    }

    // Fallback / Sandbox / Local development thermal 4x6 label view
    let shippingAddressParsed: any = {};
    try {
      shippingAddressParsed = JSON.parse(order.shippingAddress);
    } catch {
      shippingAddressParsed = { address: order.shippingAddress };
    }

    const consigneeAddress =
      shippingAddressParsed.address ||
      shippingAddressParsed.addressLine1 ||
      order.shippingAddress ||
      '';
    const city = shippingAddressParsed.city || '';
    const state = shippingAddressParsed.state || '';
    const pin = (shippingAddressParsed.pinCode || shippingAddressParsed.pincode || '').replace(/\D/g, '');

    const isCod = order.paymentMethod === 'COD';
    const codAmount = isCod ? Math.max(0, Math.round(Number(order.codBalanceAmount ?? order.total))) : 0;
    const paymentModeText = isCod ? 'COD - Surface' : 'Pre-paid - Surface';
    const physicalQty = order.items.reduce((s, it) => s + it.quantity, 0);

    const primaryItem = order.items[0];
    const primarySku = primaryItem?.product?.sku || primaryItem?.productId || 'HC-PROD';
    const primaryName = primaryItem?.productName || 'Herbal Product';

    const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Delhivery Shipping Label - ${waybill}</title>
  <style>
    @page {
      size: 4in 6in;
      margin: 0;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: 12px;
      background: #f0f0f0;
      color: #000;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .toolbar {
      width: 4in;
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .btn {
      background: #8C3A4F;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 12px;
    }
    .label-box {
      width: 4in;
      min-height: 5.8in;
      background: white;
      border: 1px solid #111;
      padding: 10px;
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .logo {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .routing-box {
      border: 1px solid #000;
      padding: 6px;
      margin-bottom: 8px;
    }
    .barcode-container {
      text-align: center;
      margin: 10px 0;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .table th, .table td {
      border: 1px solid #999;
      padding: 4px;
      text-align: left;
      font-size: 10px;
    }
    .table th { background: #eee; }
    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none !important; }
      .label-box { border: none; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn" onclick="window.print()">Print Thermal Label (4x6)</button>
    <button class="btn" style="background:#555;" onclick="window.close()">Close</button>
  </div>

  <div class="label-box">
    <div class="header">
      <div class="logo">DELHIVERY</div>
      <div style="font-size:10px; font-weight:bold;">${paymentModeText}</div>
    </div>

    <div style="font-size: 11px; margin-bottom: 6px;">
      <strong>AWB# ${waybill}</strong>
    </div>

    <div class="barcode-container">
      <svg viewBox="0 0 280 45" width="260" height="40" style="display:inline-block;">
        <rect x="10" y="0" width="3" height="40" fill="#000" />
        <rect x="16" y="0" width="2" height="40" fill="#000" />
        <rect x="22" y="0" width="4" height="40" fill="#000" />
        <rect x="30" y="0" width="2" height="40" fill="#000" />
        <rect x="36" y="0" width="5" height="40" fill="#000" />
        <rect x="45" y="0" width="2" height="40" fill="#000" />
        <rect x="52" y="0" width="4" height="40" fill="#000" />
        <rect x="60" y="0" width="2" height="40" fill="#000" />
        <rect x="68" y="0" width="4" height="40" fill="#000" />
        <rect x="76" y="0" width="2" height="40" fill="#000" />
        <rect x="82" y="0" width="5" height="40" fill="#000" />
        <rect x="91" y="0" width="2" height="40" fill="#000" />
        <rect x="98" y="0" width="3" height="40" fill="#000" />
        <rect x="106" y="0" width="2" height="40" fill="#000" />
        <rect x="112" y="0" width="4" height="40" fill="#000" />
        <rect x="120" y="0" width="2" height="40" fill="#000" />
        <rect x="128" y="0" width="3" height="40" fill="#000" />
        <rect x="135" y="0" width="5" height="40" fill="#000" />
        <rect x="145" y="0" width="2" height="40" fill="#000" />
        <rect x="152" y="0" width="4" height="40" fill="#000" />
        <rect x="160" y="0" width="2" height="40" fill="#000" />
        <rect x="168" y="0" width="4" height="40" fill="#000" />
        <rect x="176" y="0" width="2" height="40" fill="#000" />
        <rect x="184" y="0" width="5" height="40" fill="#000" />
        <rect x="194" y="0" width="2" height="40" fill="#000" />
        <rect x="202" y="0" width="3" height="40" fill="#000" />
        <rect x="210" y="0" width="4" height="40" fill="#000" />
        <rect x="220" y="0" width="2" height="40" fill="#000" />
        <rect x="226" y="0" width="5" height="40" fill="#000" />
        <rect x="236" y="0" width="2" height="40" fill="#000" />
        <rect x="244" y="0" width="4" height="40" fill="#000" />
        <rect x="252" y="0" width="2" height="40" fill="#000" />
        <rect x="260" y="0" width="4" height="40" fill="#000" />
      </svg>
      <div style="font-family:monospace; font-size:12px; font-weight:bold; letter-spacing:1px; margin-top:2px;">
        ${waybill}
      </div>
    </div>

    <div class="routing-box">
      <div style="display:flex; justify-content:space-between;">
        <div>
          <strong>Ship to:</strong> ${order.customerName}<br />
          ${consigneeAddress}<br />
          ${city}, ${state} - <strong>${pin}</strong><br />
          Phone: ${order.customerPhone.slice(-10)}
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px; font-weight:bold; margin-bottom:2px;">
            ${isCod ? `INR ${codAmount}` : 'PREPAID'}
          </div>
          <div style="font-size:9px; color:#555;">
            Order: #${order.orderNumber}<br />
            Pickup: ${getPickupLocation()}
          </div>
        </div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Product Name &amp; SKU</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${primaryName}</strong><br />
            <span style="font-size:9px; font-family:monospace;">SKU: ${primarySku}</span>
            ${order.items.length > 1 ? `<br /><span style="font-size:9px; color:#555;">+ ${order.items.length - 1} other item(s)</span>` : ''}
          </td>
          <td style="text-align:center;">${physicalQty}</td>
          <td style="text-align:right;">₹${(order.total / physicalQty).toFixed(2)}</td>
          <td style="text-align:right;">₹${order.total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:14px; font-size:9px; color:#555; border-top:1px dashed #ccc; padding-top:6px; display:flex; justify-content:space-between;">
      <div>Herbic Cure Official Dispatch</div>
      <div>Standard 4x6 Thermal Label</div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(fallbackHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    logger.error('shipping.delhivery_label.failed', {
      error: error?.message || 'Failed to generate shipping label',
    });
    return new NextResponse('Internal server error while fetching label', { status: 500 });
  }
}

