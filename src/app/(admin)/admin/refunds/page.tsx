'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RefundItem {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  approvedBy?: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    customerName: string;
    total: number;
  };
}

export default function AdminRefundsPage() {
  const { data, isLoading, mutate } = useSWR<{ refunds: RefundItem[] }>('/api/admin/refunds', fetcher);
  const refunds = data?.refunds || [];

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, reason }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to request refund');

      toast.success('Refund request submitted for OWNER authorization.');
      setShowRequestModal(false);
      setOrderId('');
      setAmount('');
      setReason('');
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error submitting refund request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    if (!confirm('CONFIRM REFUND APPROVAL: This will mark the order as REFUNDED and commit an immutable audit record.')) return;
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to approve refund');

      toast.success('Refund approved and order status updated to REFUNDED.');
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error approving refund');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">Refunds Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Two-tier authorization: Staff initiates request • OWNER approves payout
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Refund Request</span>
        </button>
      </div>

      {showRequestModal && (
        <form onSubmit={handleRequestRefund} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Initiate Refund</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="Order ID / UUID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            <input
              type="number"
              required
              placeholder="Refund Amount (INR)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            <input
              required
              placeholder="Reason for refund"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="sm:col-span-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-rose-700" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {refunds.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {r.order?.orderNumber}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{r.order?.customerName}</td>
                  <td className="p-4 font-mono font-bold text-rose-700">₹{r.amount?.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{r.reason}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.status === 'PENDING' && (
                      <button
                        onClick={() => handleApproveRefund(r.id)}
                        className="px-3.5 py-1.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        Approve (OWNER)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
