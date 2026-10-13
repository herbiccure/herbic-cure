'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Truck,
  Edit,
  X,
  Save,
  ExternalLink,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { orderUpdateSchema } from '@/lib/schemas/order';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  total: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    productImage?: string | null;
    price: number;
    quantity: number;
    total: number;
  }[];
  events: {
    id: string;
    status: string;
    description: string;
    location?: string | null;
    timestamp: string;
  }[];
}

interface ParsedAddress {
  lines: string[];
  cityStatePin: string;
  phone?: string;
  formattedText: string;
}

function parseShippingAddress(raw: string | null | undefined): ParsedAddress {
  if (!raw) {
    return { lines: ['No address provided'], cityStatePin: '', formattedText: 'No address provided' };
  }

  try {
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        const lines: string[] = [];
        if (parsed.addressLine1) lines.push(parsed.addressLine1);
        if (parsed.addressLine2) lines.push(parsed.addressLine2);
        if (parsed.address && !parsed.addressLine1) lines.push(parsed.address);

        const locParts = [
          parsed.city,
          parsed.state ? ((parsed.pinCode || parsed.pincode) ? `${parsed.state} - ${parsed.pinCode || parsed.pincode}` : parsed.state) : (parsed.pinCode || parsed.pincode),
        ].filter(Boolean);

        const cityStatePin = locParts.join(', ');
        const allParts = [...lines];
        if (cityStatePin) allParts.push(cityStatePin);

        return {
          lines: lines.length > 0 ? lines : [trimmed],
          cityStatePin,
          phone: parsed.phone,
          formattedText: allParts.join(', '),
        };
      }
    }
  } catch {}

  return { lines: [raw], cityStatePin: '', formattedText: raw };
}

export default function AdminOrdersPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading, mutate } = useSWR<{ orders: OrderItem[] }>(
    '/api/admin/orders',
    fetcher
  );
  const orders = data?.orders ?? [];

  const [activeStatus, setActiveStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Edit status in modal
  const [newStatus, setNewStatus] = useState('');
  const [newTracking, setNewTracking] = useState('');
  const [newCarrier, setNewCarrier] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const openModal = (o: OrderItem) => {
    setSelectedOrder(o);
    setNewStatus(o.orderStatus);
    setNewTracking(o.trackingNumber || '');
    setNewCarrier(o.carrier || 'Shiprocket Express');
    setEventDesc('');
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    // Validate with Zod
    const parsed = orderUpdateSchema.safeParse({
      orderStatus: newStatus,
      trackingNumber: newTracking,
      carrier: newCarrier,
      eventDescription: eventDesc,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid order parameters');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) throw new Error('Failed to update order');

      toast.success(`Order ${selectedOrder.orderNumber} updated to ${newStatus}`);
      
      // Update local cache & selected order
      mutate(
        {
          orders: orders.map((o) =>
            o.id === selectedOrder.id
              ? {
                  ...o,
                  orderStatus: newStatus,
                  trackingNumber: newTracking,
                  carrier: newCarrier,
                }
              : o
          ),
        },
        false
      );

      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: newStatus,
              trackingNumber: newTracking,
              carrier: newCarrier,
            }
          : null
      );
    } catch (err: any) {
      toast.error(err.message || 'Error updating order');
    } finally {
      setSaving(false);
    }
  };

  const parsedAddress = useMemo(() => {
    return selectedOrder ? parseShippingAddress(selectedOrder.shippingAddress) : null;
  }, [selectedOrder]);

  const columns: Column<OrderItem>[] = [
    {
      header: 'Order #',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (o) => (
        <span className={cn('font-mono font-bold', isLight ? 'text-slate-900' : 'text-white')}>
          {o.orderNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      cell: (o) => (
        <div>
          <span className={cn('font-bold block', isLight ? 'text-slate-900' : 'text-white')}>
            {o.customerName}
          </span>
          <span className={cn('text-[11px] font-mono', isLight ? 'text-slate-500' : 'text-slate-400')}>
            {o.customerPhone}
          </span>
        </div>
      ),
    },
    {
      header: 'Date',
      cell: (o) => (
        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
          {new Date(o.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Total',
      cell: (o) => (
        <span className={cn('font-bold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
          ₹{o.total.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Payment',
      cell: (o) => (
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
            o.paymentStatus === 'PAID'
              ? isLight ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
              : isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
          )}
        >
          {o.paymentMethod} • {o.paymentStatus}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (o) => (
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
            isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800 text-slate-200 border-slate-700'
          )}
        >
          {o.orderStatus}
        </span>
      ),
    },
    {
      header: 'AWB / Courier',
      cell: (o) => (
        <span className={cn('font-mono text-[11px]', isLight ? 'text-slate-600' : 'text-slate-400')}>
          {o.trackingNumber || 'Pending AWB'}
        </span>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right px-4 sm:px-6',
      className: 'text-right px-4 sm:px-6',
      cell: (o) => (
        <button
          type="button"
          onClick={() => openModal(o)}
          className="px-3.5 py-1.5 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs hover:shadow-sm cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Manage</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold font-serif', isLight ? 'text-slate-900' : 'text-white')}>
          Order Management
        </h1>
        <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
          Track customer orders, update AWB courier numbers, and print dispatch invoices.
        </p>
      </div>

      <AdminDataTable
        data={orders}
        columns={columns}
        keyExtractor={(o) => o.id}
        isLoading={isLoading}
        searchPlaceholder="Search order #, customer, AWB..."
        searchFilter={(o, q) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          (o.trackingNumber ? o.trackingNumber.toLowerCase().includes(q) : false)
        }
        statusTabs={['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        statusFilter={(o, st) => o.orderStatus === st}
        emptyMessage="No customer orders recorded yet."
      />

      {/* Order Detail & Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={cn(
              'rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border transition-colors',
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            )}
          >
            <div className={cn('flex items-center justify-between border-b pb-4', isLight ? 'border-slate-200' : 'border-slate-800')}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Order Reference
                </span>
                <h3 className={cn('text-xl font-bold font-mono', isLight ? 'text-slate-900' : 'text-white')}>
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={cn(
                  'p-2 rounded-full transition-colors cursor-pointer',
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                )}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div
              className={cn(
                'grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-4.5 rounded-2xl border transition-colors',
                isLight ? 'bg-slate-50/90 border-slate-200 text-slate-700' : 'bg-slate-800/50 border-slate-700/60 text-slate-300'
              )}
            >
              <div>
                <span className={cn('block font-bold text-[11px] uppercase tracking-wider mb-1.5', isLight ? 'text-slate-600' : 'text-slate-400')}>
                  Customer Info:
                </span>
                <p className={cn('font-bold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
                  {selectedOrder.customerName}
                </p>
                <p className={cn('mt-0.5', isLight ? 'text-slate-600' : 'text-slate-300')}>
                  {selectedOrder.customerEmail}
                </p>
                <p className={cn('font-mono mt-0.5', isLight ? 'text-slate-600' : 'text-slate-400')}>
                  {selectedOrder.customerPhone}
                </p>
              </div>

              <div>
                <span className={cn('block font-bold text-[11px] uppercase tracking-wider mb-1.5', isLight ? 'text-slate-600' : 'text-slate-400')}>
                  Delivery Address:
                </span>
                {parsedAddress && parsedAddress.lines.length > 0 ? (
                  <div className={cn('space-y-0.5 leading-relaxed text-xs', isLight ? 'text-slate-800' : 'text-slate-200')}>
                    {parsedAddress.lines.map((line, idx) => (
                      <p key={idx} className="font-medium">{line}</p>
                    ))}
                    {parsedAddress.cityStatePin && (
                      <p className="font-semibold">{parsedAddress.cityStatePin}</p>
                    )}
                    {parsedAddress.phone && parsedAddress.phone !== selectedOrder.customerPhone && (
                      <p className={cn('text-[11px] font-mono mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
                        Alt Phone: {parsedAddress.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className={cn('whitespace-pre-line leading-relaxed', isLight ? 'text-slate-800' : 'text-slate-200')}>
                    {selectedOrder.shippingAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Items Box */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={cn('text-xs font-bold uppercase tracking-wider', isLight ? 'text-slate-600' : 'text-slate-400')}>
                  Items ({selectedOrder.items.length})
                </span>
                <span className={cn('text-xs font-semibold', isLight ? 'text-slate-500' : 'text-slate-400')}>
                  Unit Price &amp; Quantity
                </span>
              </div>

              <div
                className={cn(
                  'divide-y rounded-2xl overflow-hidden border transition-colors',
                  isLight ? 'bg-slate-50 border-slate-200 divide-slate-200' : 'bg-slate-950 border-slate-800 divide-slate-800/80'
                )}
              >
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.productImage && (
                        <div
                          className={cn(
                            'relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border',
                            isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'
                          )}
                        >
                          <Image src={item.productImage} alt={item.productName} fill sizes="40px" className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4
                          className={cn('font-bold text-xs sm:text-[13px] truncate block', isLight ? 'text-slate-900' : 'text-white')}
                          title={item.productName}
                        >
                          {item.productName}
                        </h4>
                        <p className={cn('text-[11px] mt-0.5', isLight ? 'text-slate-500' : 'text-slate-400')}>
                          Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm shrink-0 font-mono">
                      ₹{item.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className={cn('flex justify-between items-center font-bold text-sm pt-2 px-1 border-t', isLight ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white')}>
                <span>Total Amount:</span>
                <span className="text-rose-600 dark:text-rose-400 text-base font-extrabold font-mono">
                  ₹{selectedOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Status & Courier Update Form */}
            <form
              onSubmit={handleUpdateOrder}
              className={cn(
                'p-5 rounded-2xl border space-y-4 text-xs transition-colors',
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
              )}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-600" />
                <h4 className={cn('font-bold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
                  Update Order &amp; Tracking Info
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={cn('block font-semibold mb-1 text-[11px]', isLight ? 'text-slate-700' : 'text-slate-300')}>
                    Order Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className={cn(
                      'w-full rounded-xl p-2.5 text-xs font-semibold border transition-colors outline-hidden',
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600'
                        : 'bg-slate-900 border-slate-700 text-white focus:border-rose-500'
                    )}
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="PACKED">PACKED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className={cn('block font-semibold mb-1 text-[11px]', isLight ? 'text-slate-700' : 'text-slate-300')}>
                    Carrier Name
                  </label>
                  <input
                    type="text"
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    placeholder="e.g. Shiprocket Express"
                    className={cn(
                      'w-full rounded-xl p-2.5 text-xs border transition-colors outline-hidden',
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-600'
                        : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500'
                    )}
                  />
                </div>

                <div>
                  <label className={cn('block font-semibold mb-1 text-[11px]', isLight ? 'text-slate-700' : 'text-slate-300')}>
                    AWB Tracking Number
                  </label>
                  <input
                    type="text"
                    value={newTracking}
                    onChange={(e) => setNewTracking(e.target.value)}
                    placeholder="e.g. SR-HYD-998241"
                    className={cn(
                      'w-full rounded-xl p-2.5 text-xs font-mono border transition-colors outline-hidden',
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-600'
                        : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className={cn('block font-semibold mb-1 text-[11px]', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  New Event Milestone Note
                </label>
                <input
                  type="text"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="e.g. Package dispatched from Hyderabad central hub."
                  className={cn(
                    'w-full rounded-xl p-2.5 text-xs border transition-colors outline-hidden',
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-600'
                      : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500'
                  )}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Link
                  href={`/track-order?orderId=${encodeURIComponent(selectedOrder.orderNumber)}`}
                  target="_blank"
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors',
                    isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  )}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public Tracking View</span>
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Updating...' : 'Save Updates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
