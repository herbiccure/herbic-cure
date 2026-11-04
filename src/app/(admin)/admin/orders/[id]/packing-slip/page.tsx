import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BarcodeSvg } from '@/components/shipping/BarcodeSvg';
import { PackingSlipActions } from './PackingSlipActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackingSlipPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id },
        { orderNumber: id },
        { orderNumber: id.replace(/^#/, '') },
      ],
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
    notFound();
  }

  // Safe parsing of destination address
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
    // Keep raw string fallback
  }

  const isPrepaid = order.paymentMethod !== 'COD';
  const orderAdv = Number((order as any).advanceAmount ?? 0);
  const codBalance = Number((order as any).codBalanceAmount ?? (order.total - orderAdv));
  const collectAmount = isPrepaid ? 0 : Math.max(0, Math.round(codBalance));
  const deliveryCharges = Number(order.shippingFee || 0);
  const totalPhysicalItems = order.items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Print & Navigation Actions Toolbar (Hidden on print) */}
      <PackingSlipActions
        orderId={order.id}
        orderNumber={order.orderNumber}
        hasTracking={Boolean(order.trackingNumber)}
      />

      {/* Printable Packing Slip Sheet */}
      <div
        id="packing-slip-printable"
        className="bg-white text-black border border-slate-300 rounded-xl p-6 sm:p-8 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:rounded-none"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Herbic Cure
            </h1>
            <p className="text-xs font-semibold text-slate-700 tracking-wide">
              Authentic Ayurvedic Hair Care • Warehouse Dispatch Slip
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Bapatla, Andhra Pradesh - 522101 | Contact: +91 86888 88114
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-md">
              Packing Slip
            </span>
            <span className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Printed: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Identification & Barcodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 mb-5 border-b border-slate-200">
          {/* Order ID & Barcode */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Website Order ID
            </div>
            <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
              #{order.orderNumber}
            </div>
            <div className="mt-2 flex justify-start">
              <BarcodeSvg value={order.orderNumber} height={36} moduleWidth={1.5} />
            </div>
          </div>

          {/* Delhivery AWB & Barcode */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Delhivery Courier AWB</span>
              <span className="text-[10px] font-mono font-semibold text-slate-500">Surface Express</span>
            </div>
            <div className="text-lg font-black font-mono text-indigo-950 mt-0.5">
              {order.trackingNumber || 'UNMANIFESTED (PENDING)'}
            </div>
            <div className="mt-2 flex justify-start">
              {order.trackingNumber ? (
                <BarcodeSvg value={order.trackingNumber} height={36} moduleWidth={1.5} />
              ) : (
                <div className="text-xs text-amber-800 font-medium py-2">
                  No AWB allocated yet. Manifest order from Admin to generate courier tracking.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 mb-5 border-b border-slate-200 text-xs">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-slate-700 text-[11px] mb-1.5">
              Shipping Destination (Consignee)
            </h3>
            <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
            <p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-line">
              {destAddress}
            </p>
            {(city || state || pincode) && (
              <p className="text-slate-800 font-semibold mt-1">
                {city ? `${city}, ` : ''}{state ? `${state} - ` : ''}<strong>{pincode}</strong>
              </p>
            )}
            <p className="text-slate-800 font-mono mt-1.5">
              Phone: <strong>+91 {order.customerPhone.replace(/\D/g, '').slice(-10)}</strong>
            </p>
            {order.customerEmail && !order.customerEmail.includes('guest_') && (
              <p className="text-slate-600 mt-0.5">{order.customerEmail}</p>
            )}
          </div>

          <div className="sm:border-l sm:pl-4 border-slate-200">
            <h3 className="font-bold uppercase tracking-wider text-slate-700 text-[11px] mb-1.5">
              Payment &amp; Collection Summary
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Payment Mode:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isPrepaid ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {isPrepaid ? 'PREPAID (ONLINE)' : 'CASH ON DELIVERY (COD)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Payment Status:</span>
                <span className="font-semibold text-slate-900">{order.paymentStatus}</span>
              </div>

              {isPrepaid ? (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded mt-2 text-center">
                  <span className="text-xs font-bold text-emerald-900">
                    Paid in full • ₹0 to collect on delivery
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                    <span>COD Amount to Collect:</span>
                    <span className="text-sm font-black font-mono">₹{collectAmount}</span>
                  </div>
                  {orderAdv > 0 && (
                    <div className="text-[10px] text-amber-800 mt-0.5">
                      (Customer already paid ₹{orderAdv} advance)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Products Table */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold uppercase tracking-wider text-slate-800 text-[11px]">
              Package Contents ({totalPhysicalItems} physical items)
            </h3>
            <span className="text-[11px] text-slate-500">
              Single-piece parcel dispatch
            </span>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-y-2 border-slate-900 text-slate-800">
                <th className="py-2 px-2 text-center w-10">Pick</th>
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-3 text-left">Product Name &amp; Description</th>
                <th className="py-2 px-3 text-left w-32 font-mono">SKU Code</th>
                <th className="py-2 px-2 text-center w-14">Qty</th>
                <th className="py-2 px-3 text-right w-24">Unit Price</th>
                <th className="py-2 px-3 text-right w-24">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((it, idx) => {
                const sku = it.product?.sku || it.productId || 'HC-PROD';
                const unitPrice = Number(it.price || 0);
                const lineTotal = unitPrice * (it.quantity || 1);

                return (
                  <tr key={it.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-2 text-center align-middle">
                      <div className="w-4 h-4 mx-auto border-2 border-slate-400 rounded-sm"></div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-500 align-middle">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 align-middle">
                      <p className="font-bold text-slate-900">{it.productName}</p>
                      {it.product?.labelName && it.product.labelName !== it.productName && (
                        <p className="text-[11px] text-slate-500">Short label: {it.product.labelName}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 align-middle">
                      {sku}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900 align-middle">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 align-middle">
                      ₹{unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 align-middle">
                      ₹{lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 mb-5 border-b border-slate-200 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-sm text-slate-600 text-[11px] leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1">Standard Packaging Guidelines:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Ensure bottles are sealed with leakproof safety cap.</li>
              <li>Wrap each glass/oil container in two layers of bubble wrap.</li>
              <li>Affix Delhivery thermal 4x6 shipping label visibly on top face.</li>
            </ul>
          </div>

          <div className="w-full sm:w-72 space-y-1.5 self-end">
            <div className="flex justify-between py-1 text-slate-700">
              <span>Product Subtotal:</span>
              <span className="font-mono font-semibold">₹{order.subtotal.toFixed(2)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between py-1 text-emerald-800">
                <span>Discount Applied:</span>
                <span className="font-mono font-semibold">- ₹{order.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-800 font-semibold border-t border-dashed border-slate-300 pt-1.5">
              <span>Delivery Charges:</span>
              <span className="font-mono">
                {deliveryCharges > 0 ? `₹${deliveryCharges.toFixed(2)}` : 'FREE'}
              </span>
            </div>

            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-slate-900 text-sm font-black">
              <span>Final Order Total:</span>
              <span className="font-mono">₹{order.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 px-2 bg-slate-100 rounded text-slate-900 font-bold text-xs">
              <span>Amount Due / Collect:</span>
              <span className="font-mono">₹{collectAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Warehouse Verification & Sign-off Section */}
        <div className="pt-2 text-xs">
          <h4 className="font-bold uppercase tracking-wider text-slate-700 text-[11px] mb-2">
            Warehouse Inspection &amp; Sign-off
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-[11px] text-slate-700">
            <label className="flex items-center gap-2 p-2 border border-slate-200 rounded">
              <input type="checkbox" className="rounded" />
              <span>Items &amp; SKUs matched</span>
            </label>
            <label className="flex items-center gap-2 p-2 border border-slate-200 rounded">
              <input type="checkbox" className="rounded" />
              <span>Bottle seals &amp; wrap verified</span>
            </label>
            <label className="flex items-center gap-2 p-2 border border-slate-200 rounded">
              <input type="checkbox" className="rounded" />
              <span>Delhivery label attached</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="border-t border-slate-400 pt-2 flex justify-between text-[11px] text-slate-600">
              <span>Packed By: _________________________</span>
              <span>Date: _______________</span>
            </div>
            <div className="border-t border-slate-400 pt-2 flex justify-between text-[11px] text-slate-600">
              <span>Checked By: ________________________</span>
              <span>Sign: _______________</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono">
          Herbic Cure Official Warehouse Fulfillment System • Retain packing slip with warehouse manifest copy
        </div>
      </div>

      {/* Embedded Print Stylesheet */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: auto;
              margin: 6mm 8mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-size: 11pt !important;
            }
            header, aside, nav, .no-print, [role="navigation"] {
              display: none !important;
            }
            .admin-main-wrapper {
              margin-left: 0 !important;
              padding: 0 !important;
              background: transparent !important;
            }
            main {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            #packing-slip-printable {
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              width: 100% !important;
            }
          }
        `,
      }} />
    </div>
  );
}

