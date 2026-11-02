'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  X,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
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
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
  delhiveryStatus?: string | null;
  delhiverySyncStatus?: string | null;
  delhiverySyncError?: string | null;
  shippingMode?: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    price: number;
    quantity: number;
    total: number;
    product?: {
      labelName?: string | null;
      sku?: string | null;
    } | null;
  }[];
}

interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
  formattedText: string;
}

function parseAddress(raw: string | null | undefined): ParsedAddress {
  if (!raw) return { address: '', city: '', state: '', pincode: '', formattedText: 'No address' };
  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const p = JSON.parse(trimmed);
      const addr = p.address || p.addressLine1 || '';
      const city = p.city || '';
      const state = p.state || '';
      const pin = p.pinCode || p.pincode || '';
      const full = [addr, p.addressLine2, city, state ? (pin ? `${state} - ${pin}` : state) : pin].filter(Boolean).join(', ');
      return { address: addr, city, state, pincode: pin, formattedText: full || trimmed };
    }
  } catch {}
  return { address: raw, city: '', state: '', pincode: '', formattedText: raw };
}

export default function OrdersToConfirmPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading, mutate } = useSWR<{ orders: OrderItem[] }>(
    '/api/admin/orders',
    fetcher
  );

  const allOrders = useMemo(() => data?.orders ?? [], [data?.orders]);

  // Filter orders awaiting confirmation:
  // No active AWB, not cancelled, and in confirm_then_send mode or unmanifested
  const ordersToConfirm = useMemo(() => {
    return allOrders.filter((o) => {
      if (o.orderStatus === 'CANCELLED') return false;
      if (o.trackingNumber && !o.trackingNumber.startsWith('DLH')) return false;
      return (
        o.delhiveryStatus === 'AWAITING_CONFIRMATION' ||
        o.delhiverySyncStatus === 'PENDING_CONFIRMATION' ||
        o.delhiverySyncStatus === 'FAILED' ||
        (!o.trackingNumber && (o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PENDING'))
      );
    });
  }, [allOrders]);

  // Selected orders for bulk action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Edit address & details modal state
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editCodBalance, setEditCodBalance] = useState<number | ''>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reject order modal state
  const [rejectingOrder, setRejectingOrder] = useState<OrderItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [savingReject, setSavingReject] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === ordersToConfirm.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ordersToConfirm.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openEditModal = (o: OrderItem) => {
    setEditingOrder(o);
    setEditName(o.customerName || '');
    setEditPhone(o.customerPhone || '');
    const addr = parseAddress(o.shippingAddress);
    setEditStreet(addr.address || '');
    setEditCity(addr.city || '');
    setEditState(addr.state || '');
    setEditPincode(addr.pincode || '');
    setEditCodBalance(
      o.codBalanceAmount !== null && o.codBalanceAmount !== undefined
        ? o.codBalanceAmount
        : o.paymentMethod === 'COD'
        ? o.total
        : 0
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editName.trim(),
          customerPhone: editPhone.trim(),
          address: editStreet.trim(),
          city: editCity.trim(),
          state: editState.trim(),
          pincode: editPincode.trim(),
          codBalanceAmount: editCodBalance !== '' ? Number(editCodBalance) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order details');

      toast.success(`Order #${editingOrder.orderNumber} details updated!`);
      setEditingOrder(null);
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Error updating order');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmSingle = async (order: OrderItem) => {
    setProcessingIds((prev) => ({ ...prev, [order.id]: true }));
    try {
      const res = await fetch('/api/admin/orders/confirm-and-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm order with Delhivery');

      const result = data.results?.[0];
      if (result && result.success) {
        toast.success(`Order #${order.orderNumber} confirmed & sent to Delhivery! AWB: ${result.waybill}`);
      } else {
        toast.error(`Shipping sync failed for #${order.orderNumber}: ${result?.error || 'Rejected by Delhivery'}`);
      }

      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm order');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one order to confirm');
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await fetch('/api/admin/orders/confirm-and-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk confirmation failed');

      if (data.success) {
        toast.success(data.summary || `All ${selectedIds.length} orders confirmed & sent to Delhivery!`);
        setSelectedIds([]);
      } else {
        toast.warning(data.summary || 'Some orders failed during Delhivery sync. Check errors below.');
      }

      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process bulk confirmation');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleRejectSingle = async () => {
    if (!rejectingOrder) return;
    setSavingReject(true);
    try {
      const res = await fetch(`/api/admin/orders/${rejectingOrder.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason.trim() || 'Rejected by staff during order review',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject order');

      toast.success(`Order #${rejectingOrder.orderNumber} cancelled. Inventory restocked.`);
      setRejectingOrder(null);
      setRejectReason('');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Error rejecting order');
    } finally {
      setSavingReject(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one order to reject');
      return;
    }

    if (!window.confirm(`Are you sure you want to reject and cancel ${selectedIds.length} selected orders?`)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await fetch('/api/admin/orders/bulk-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedIds,
          reason: 'Bulk rejection by staff during verification',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk rejection failed');

      toast.success(data.summary || `Selected orders cancelled and items restocked.`);
      setSelectedIds([]);
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process bulk rejection');
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/orders"
              className={cn(
                'inline-flex items-center gap-1 text-xs font-bold transition-colors',
                isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              )}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Orders</span>
            </Link>
          </div>
          <h1 className={cn('text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>
            Orders to Confirm
          </h1>
          <p className={cn('text-xs mt-0.5', isLight ? 'text-slate-500' : 'text-slate-400')}>
            Verify customer phone, shipping address and COD balances before dispatching to Delhivery Express.
          </p>
        </div>

        {/* Global Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkConfirm}
              disabled={bulkProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {bulkProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Confirm &amp; send to Delhivery ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={handleBulkReject}
              disabled={bulkProcessing}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Selected ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Info Notice Box */}
      <div
        className={cn(
          'p-4 rounded-2xl border flex items-start gap-3',
          isLight ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-amber-950/20 border-amber-800 text-amber-200'
        )}
      >
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">Shipping Mode Active: Confirm Then Send</span>. New orders wait here safely until staff review and click <strong>&quot;Confirm &amp; send to Delhivery&quot;</strong>. Delhivery generates the AWB directly upon confirmation.
        </div>
      </div>

      {/* Orders Table */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden shadow-xs',
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        )}
      >
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
            Loading orders awaiting confirmation...
          </div>
        ) : ordersToConfirm.length === 0 ? (
          <div className="p-12 text-center text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className={cn('font-bold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
              All caught up!
            </p>
            <p className="text-slate-500 mt-1">
              There are no orders awaiting confirmation right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={cn(
                  'border-b text-[11px] font-bold uppercase tracking-wider',
                  isLight ? 'bg-slate-50/80 border-slate-200 text-slate-600' : 'bg-slate-800/50 border-slate-700 text-slate-400'
                )}
              >
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === ordersToConfirm.length && ordersToConfirm.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="p-4">Order # &amp; Date</th>
                  <th className="p-4">Customer &amp; Phone</th>
                  <th className="p-4">Shipping Address</th>
                  <th className="p-4">Items &amp; Quantities</th>
                  <th className="p-4">Totals &amp; COD Balance</th>
                  <th className="p-4">Sync Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ordersToConfirm.map((order) => {
                  const addr = parseAddress(order.shippingAddress);
                  const isProcessing = Boolean(processingIds[order.id]);
                  const hasFailed = order.delhiverySyncStatus === 'FAILED';
                  const isCod = order.paymentMethod === 'COD';

                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        'transition-colors',
                        selectedIds.includes(order.id)
                          ? isLight ? 'bg-emerald-50/40' : 'bg-emerald-950/20'
                          : isLight ? 'hover:bg-slate-50/60' : 'hover:bg-slate-800/40'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelectOne(order.id)}
                          className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                        />
                      </td>

                      {/* Order # and Date */}
                      <td className="p-4 align-top">
                        <span className={cn('font-mono font-bold block', isLight ? 'text-slate-900' : 'text-white')}>
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                          To Confirm
                        </span>
                      </td>

                      {/* Customer & Phone */}
                      <td className="p-4 align-top">
                        <span className={cn('font-bold block', isLight ? 'text-slate-900' : 'text-white')}>
                          {order.customerName}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {order.customerPhone}
                        </span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">
                          {order.customerEmail}
                        </span>
                      </td>

                      {/* Shipping Address */}
                      <td className="p-4 align-top max-w-xs">
                        <p className={cn('text-xs leading-snug', isLight ? 'text-slate-700' : 'text-slate-300')}>
                          {addr.formattedText}
                        </p>
                        {addr.pincode && (
                          <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            PIN: {addr.pincode}
                          </span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          {order.items.map((it) => (
                            <div key={it.id} className="text-xs flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {it.product?.labelName || it.productName}
                              </span>
                              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-600 dark:text-slate-300">
                                x{it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Totals & COD */}
                      <td className="p-4 align-top">
                        <span className={cn('font-mono font-bold block', isLight ? 'text-slate-900' : 'text-white')}>
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                          <div>Fee: ₹{order.shippingFee}</div>
                          {isCod ? (
                            <div className="font-bold text-amber-700 dark:text-amber-400">
                              Collect COD: ₹{Number(order.codBalanceAmount ?? order.total).toLocaleString('en-IN')}
                            </div>
                          ) : (
                            <div className="font-bold text-emerald-600">
                              Prepaid (Paid)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sync Status */}
                      <td className="p-4 align-top">
                        {hasFailed ? (
                          <div className="text-rose-600 dark:text-rose-400">
                            <span className="font-bold block text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              Shipping sync failed
                            </span>
                            <span className="text-[10px] block mt-0.5 line-clamp-2" title={order.delhiverySyncError || ''}>
                              {order.delhiverySyncError || 'Delhivery API error'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmSingle(order)}
                              disabled={isProcessing}
                              className="mt-1 px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <RefreshCw className={cn('w-2.5 h-2.5', isProcessing && 'animate-spin')} />
                              <span>Retry</span>
                            </button>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Awaiting Dispatch
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(order)}
                            className={cn(
                              'p-1.5 rounded-lg border transition-colors cursor-pointer',
                              isLight
                                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            )}
                            title="Edit Address / Phone / COD Amount"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleConfirmSingle(order)}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Confirm & send to Delhivery"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Confirm &amp; Send</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRejectingOrder(order);
                              setRejectReason('');
                            }}
                            className={cn(
                              'p-1.5 rounded-lg border transition-colors cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                            )}
                            title="Reject & Cancel Order"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Address, Phone & COD Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={cn(
              'rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border transition-colors',
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            )}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Edit Order Details
                </span>
                <h3 className="font-bold text-base font-mono">
                  {editingOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Customer Phone (10 digits)
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-3 py-2 rounded-xl border font-mono bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    PIN Code (6 digits)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 rounded-xl border font-mono bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {editingOrder.paymentMethod === 'COD' && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    COD Amount to Collect (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editCodBalance}
                    onChange={(e) => setEditCodBalance(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border font-mono bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Order Total: ₹{editingOrder.total} | Advance Paid: ₹{editingOrder.advanceAmount || 0}
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl border text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={cn(
              'rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border transition-colors',
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            )}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                  Reject Order
                </span>
                <h3 className="font-bold text-base font-mono">
                  {rejectingOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Rejecting this order will mark it <strong>CANCELLED</strong>, immediately restore items to stock, and flag a refund request if money was paid.
            </p>

            <div>
              <label className="block font-bold text-xs text-slate-600 dark:text-slate-400 mb-1">
                Reason for rejection
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation / unserviceable address"
                className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSingle}
                disabled={savingReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingReject ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Reject &amp; Restock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
