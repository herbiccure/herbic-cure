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
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageCircle,
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
  advanceAmount?: number;
  codBalanceAmount?: number | null;
  advancePaymentId?: string | null;
  advancePaidAt?: string | null;
  advanceSettingsSnapshot?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
  pickupStatus?: string | null;
  pickupRequestId?: string | null;
  pickupDate?: string | null;
  pickupTime?: string | null;
  pickupError?: string | null;
  pickupAttempts?: number;
  lastPickupAttemptAt?: string | null;
  shippingMode?: string | null;
  delhiveryStatus?: string | null;
  delhiverySyncStatus?: string | null;
  delhiverySyncError?: string | null;
  delhiverySyncAttempts?: number;
  lastDelhiverySyncAt?: string | null;
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
  const [syncingDelhivery, setSyncingDelhivery] = useState(false);
  const [manifestingDelhivery, setManifestingDelhivery] = useState(false);

  const openModal = (o: OrderItem) => {
    setSelectedOrder(o);
    setNewStatus(o.orderStatus);
    setNewTracking(o.trackingNumber || '');
    setNewCarrier(o.carrier || 'Delhivery');
    setEventDesc('');
  };

  const handleManifestDelhivery = async (force: boolean = false) => {
    if (!selectedOrder?.id) return;
    setManifestingDelhivery(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/manifest-delhivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to manifest order with Delhivery');

      toast.success(data.message || `Delhivery AWB generated: ${data.waybill}`);

      if (data.order) {
        setSelectedOrder(data.order);
        setNewTracking(data.order.trackingNumber || '');
        setNewCarrier(data.order.carrier || 'Delhivery');
        setNewStatus(data.order.orderStatus);
        mutate(
          {
            orders: orders.map((o) => (o.id === data.order.id ? { ...o, ...data.order } : o)),
          },
          false
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Error manifesting with Delhivery');
    } finally {
      setManifestingDelhivery(false);
    }
  };

  const handleSyncDelhivery = async () => {
    if (!selectedOrder?.id) return;
    setSyncingDelhivery(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/sync-delhivery`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync with Delhivery');

      if (data.isCancelled) {
        toast.warning(
          `Delhivery Status: CANCELLED. Order #${selectedOrder.orderNumber} is marked CANCELLED and items restored to stock.`
        );
        setNewStatus('CANCELLED');
      } else {
        toast.success(data.message || `Delhivery status: ${data.tracking?.status || 'IN_TRANSIT'}`);
      }

      if (data.order) {
        setSelectedOrder(data.order);
        setNewStatus(data.order.orderStatus);
        mutate(
          {
            orders: orders.map((o) => (o.id === data.order.id ? { ...o, ...data.order } : o)),
          },
          false
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Error syncing with Delhivery');
    } finally {
      setSyncingDelhivery(false);
    }
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order');

      toast.success(data.message || `Order ${selectedOrder.orderNumber} updated to ${newStatus}`);
      if (data.delhivery?.message) {
        toast.info(`Delhivery Express: ${data.delhivery.message}`);
      }
      
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
      cell: (o) => {
        const isCodAdvance = o.paymentMethod === 'COD' && (o.advanceAmount || 0) > 0;
        return (
          <div className="space-y-1">
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block',
                o.paymentStatus === 'PAID'
                  ? isLight ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
                  : isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
              )}
            >
              {isCodAdvance
                ? `COD • Adv ₹${o.advanceAmount} Paid`
                : `${o.paymentMethod} • ${o.paymentStatus}`}
            </span>
            {isCodAdvance && (
              <span className="block text-[10px] font-medium text-slate-500">
                Bal: ₹{(o.codBalanceAmount ?? (o.total - (o.advanceAmount || 0))).toLocaleString()}
              </span>
            )}
          </div>
        );
      },
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
      header: 'AWB / Pickup',
      cell: (o) => (
        <div className="space-y-1">
          {o.trackingNumber ? (
            <span className={cn('font-mono text-[11px] block font-bold', isLight ? 'text-slate-900' : 'text-slate-100')}>
              {o.trackingNumber}
            </span>
          ) : o.orderStatus === 'CANCELLED' ? (
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border',
                isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
              )}
            >
              Cancelled
            </span>
          ) : o.delhiverySyncStatus === 'FAILED' ? (
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border',
                isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950/80 text-rose-300 border-rose-800'
              )}
              title={o.delhiverySyncError || 'Delhivery staging failed'}
            >
              Sync Failed
            </span>
          ) : (
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border',
                isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950/80 text-amber-300 border-amber-800'
              )}
              title="Staged in Delhivery One Pending queue. Awaiting warehouse staff verification."
            >
              Delhivery Pending
            </span>
          )}
          <span
            className={cn(
              'inline-block px-2 py-0.5 rounded text-[10px] font-semibold border',
              o.pickupStatus === 'SCHEDULED'
                ? isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : o.pickupStatus === 'FAILED'
                ? isLight
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800'
                : isLight
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            )}
            title={o.pickupError || undefined}
          >
            {o.pickupStatus === 'SCHEDULED'
              ? 'Pickup: Scheduled'
              : o.pickupStatus === 'FAILED'
              ? 'Pickup: Failed'
              : 'Pickup: None'}
          </span>
        </div>
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
        statusTabs={['ALL', 'PENDING_AWB', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        statusFilter={(o, st) => {
          if (st === 'PENDING_AWB') {
            return !o.trackingNumber && o.orderStatus !== 'CANCELLED';
          }
          return o.orderStatus === st;
        }}
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

              <div className={cn('space-y-1.5 pt-2 px-1 border-t text-xs', isLight ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white')}>
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>Total Amount:</span>
                  <span className="text-rose-600 dark:text-rose-400 text-base font-extrabold font-mono">
                    ₹{selectedOrder.total.toLocaleString()}
                  </span>
                </div>
                {selectedOrder.advanceAmount && selectedOrder.advanceAmount > 0 ? (
                  <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>COD Advance Paid Online:</span>
                      <span className="font-mono">₹{selectedOrder.advanceAmount.toLocaleString()}</span>
                    </div>
                    {selectedOrder.advancePaymentId && (
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Gateway Payment ID:</span>
                        <span className="font-mono">{selectedOrder.advancePaymentId}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                      <span>COD Balance to Collect:</span>
                      <span className="font-mono">
                        ₹{(selectedOrder.codBalanceAmount ?? (selectedOrder.total - selectedOrder.advanceAmount)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Delhivery Order Verification & Logistics Queue */}
            {!selectedOrder.trackingNumber && selectedOrder.orderStatus !== 'CANCELLED' ? (
              <div
                className={cn(
                  'p-5 rounded-2xl border space-y-4 text-xs transition-colors',
                  isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-950/20 border-amber-900/50'
                )}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h4 className={cn('font-bold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
                        {selectedOrder.shippingMode === 'auto_manifest'
                          ? 'Order Verification (Direct Manifestation Mode)'
                          : 'Order Verification in Delhivery One (Pending Queue)'}
                      </h4>
                      <p className={cn('text-[11px]', isLight ? 'text-slate-500' : 'text-slate-400')}>
                        Delhivery Charges: <strong className="text-emerald-600 dark:text-emerald-400">₹0 Deducted</strong> (Order is not manifested yet)
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                      selectedOrder.delhiverySyncStatus === 'FAILED'
                        ? isLight ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
                        : isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-800'
                    )}
                  >
                    {selectedOrder.delhiverySyncStatus === 'FAILED' ? 'Delhivery Sync Failed' : 'Awaiting Warehouse Verification'}
                  </span>
                </div>

                {/* Staging Failure Alert Box */}
                {selectedOrder.delhiverySyncStatus === 'FAILED' && (
                  <div
                    className={cn(
                      'p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3',
                      isLight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-950/40 border-rose-800 text-rose-200'
                    )}
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Staging to Delhivery Failed</span>
                      </p>
                      <p className="text-[11px] opacity-90 leading-relaxed font-mono">
                        {selectedOrder.delhiverySyncError || 'Network or authorization error communicating with Delhivery API.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={syncingDelhivery}
                      onClick={handleSyncDelhivery}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1 shrink-0 transition-colors shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className={cn('w-3 h-3', syncingDelhivery && 'animate-spin')} />
                      <span>{syncingDelhivery ? 'Retrying...' : 'Retry Push'}</span>
                    </button>
                  </div>
                )}

                <div className={cn('p-3 rounded-xl border text-[11px] leading-relaxed', isLight ? 'bg-white border-amber-200/80 text-slate-700' : 'bg-slate-900/80 border-amber-900/40 text-slate-300')}>
                  {selectedOrder.shippingMode === 'auto_manifest' ? (
                    <span>Verify customer phone and delivery address before accepting. Delhivery wallet balance will <strong>ONLY</strong> be deducted after you click <strong>&quot;Accept &amp; Generate AWB&quot;</strong>. If this is a fake order, reject it with zero charges.</span>
                  ) : (
                    <span>
                      This order is staged in your <strong>Delhivery One</strong> dashboard under <strong>Main Menu &gt; Orders &gt; Forward Orders &gt; Pending</strong>.
                      Warehouse staff should verify phone/address and click <strong>&quot;Get AWB number&quot;</strong> in Delhivery One. Once manifested, the AWB automatically syncs here.
                    </span>
                  )}
                </div>

                {/* Direct Customer Contact Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Customer ({selectedOrder.customerPhone})</span>
                  </a>
                  <a
                    href={`https://wa.me/91${selectedOrder.customerPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      `Hello ${selectedOrder.customerName}, this is Herbic Cure confirming your order #${selectedOrder.orderNumber} for ₹${selectedOrder.total}. Is your address confirmed for delivery?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors text-emerald-800 dark:text-emerald-300 shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Verification</span>
                  </a>
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-amber-200/80 dark:border-amber-800/40 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus('CANCELLED');
                      setEventDesc('Order rejected during verification (fake / unverified order)');
                      toast.info('Status set to CANCELLED. Click "Save Changes" below to finalize rejection with zero Delhivery charges.');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Mark as Fake / Reject (₹0 Charged)</span>
                  </button>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href="https://one.delhivery.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <span>Open Delhivery One (Pending Queue)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      disabled={syncingDelhivery}
                      onClick={handleSyncDelhivery}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                      title="Poll Delhivery One to check if warehouse staff manifested this order"
                    >
                      <RefreshCw className={cn('w-4 h-4', syncingDelhivery && 'animate-spin')} />
                      <span>{syncingDelhivery ? 'Checking...' : 'Check Delhivery Status / Discover AWB'}</span>
                    </button>

                    {selectedOrder.shippingMode === 'auto_manifest' && (
                      <button
                        type="button"
                        disabled={manifestingDelhivery}
                        onClick={() => handleManifestDelhivery(false)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className={cn('w-4 h-4', manifestingDelhivery && 'animate-spin')} />
                        <span>
                          {manifestingDelhivery
                            ? 'Manifesting with Delhivery...'
                            : 'Accept Order & Generate Delhivery AWB'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Delhivery Manifested & Logistics Card */
              <div
                className={cn(
                  'p-5 rounded-2xl border space-y-3.5 text-xs transition-colors',
                  isLight ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-950/20 border-indigo-900/50'
                )}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={cn('font-bold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
                        Delhivery Express Shipment
                      </h4>
                      {selectedOrder.trackingNumber && (
                        <p className={cn('text-[11px] font-mono mt-0.5', isLight ? 'text-slate-600' : 'text-slate-300')}>
                          AWB: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedOrder.trackingNumber}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] font-bold border',
                        selectedOrder.orderStatus === 'DELIVERED'
                          ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : selectedOrder.orderStatus === 'SHIPPED' || selectedOrder.orderStatus === 'OUT_FOR_DELIVERY'
                          ? isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-950 text-blue-300 border-blue-800'
                          : selectedOrder.pickupStatus === 'SCHEDULED'
                          ? isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-800'
                          : isLight ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                      )}
                    >
                      Status: {selectedOrder.orderStatus} {selectedOrder.pickupStatus === 'SCHEDULED' ? '• Pickup Scheduled' : ''}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    'p-3.5 rounded-xl border text-xs space-y-1.5',
                    isLight ? 'bg-white/80 border-indigo-100 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  )}
                >
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Courier operations handled in Delhivery One</span>
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Label printing, parcel packaging, and rider pickups (&quot;Add to Pickup&quot;) are managed directly in your <strong>Delhivery One</strong> portal. Real-time carrier scans (Pickup, In Transit, Out for Delivery, Delivered) automatically sync here and update customer tracking.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {selectedOrder.trackingUrl && (
                      <a
                        href={selectedOrder.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs"
                      >
                        <span>Public Tracking Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <a
                      href="https://one.delhivery.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <span>Open Delhivery One Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncDelhivery}
                    disabled={syncingDelhivery}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    title="Pull live status from Delhivery network and synchronize order state"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', syncingDelhivery && 'animate-spin')} />
                    <span>{syncingDelhivery ? 'Syncing...' : 'Sync Live Status'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Manual Order Override Form */}
            <form
              onSubmit={handleUpdateOrder}
              className={cn(
                'p-5 rounded-2xl border space-y-4 text-xs transition-colors',
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-slate-500" />
                  <h4 className={cn('font-bold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
                    Manual Override &amp; Notes
                  </h4>
                </div>
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

              {newStatus === 'CANCELLED' && (
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn',
                    isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-rose-950/40 border-rose-800 text-rose-200'
                  )}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Delhivery Express Cancellation Trigger</p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Updating to CANCELLED will automatically call the Delhivery API (/api/p/edit) to stop shipment dispatch
                      {selectedOrder?.trackingNumber ? ` for AWB #${selectedOrder.trackingNumber}` : ''} and restore item quantities back into active inventory.
                    </p>
                  </div>
                </div>
              )}

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
