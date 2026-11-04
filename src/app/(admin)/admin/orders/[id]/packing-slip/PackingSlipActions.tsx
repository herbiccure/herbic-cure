'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, ExternalLink, Layers, PackageCheck, CheckCircle2 } from 'lucide-react';

interface PackingSlipActionsProps {
  orderId: string;
  orderNumber: string;
  hasTracking: boolean;
  isPacked?: boolean;
  pickupStatus?: string;
  packedAt?: string | null;
  packedBy?: string | null;
}

export function PackingSlipActions({
  orderId,
  orderNumber,
  hasTracking,
  isPacked = false,
  packedAt,
  packedBy,
}: PackingSlipActionsProps) {
  const [packed, setPacked] = useState(isPacked);
  const [packing, setPacking] = useState(false);
  const [packMsg, setPackMsg] = useState<string | null>(null);

  const handlePrintPackingSlip = () => {
    window.print();
  };

  const handlePrintDelhiveryLabel = () => {
    window.open(`/api/admin/orders/${orderId}/delhivery-label`, '_blank');
  };

  const handlePrintBoth = () => {
    // Open Delhivery shipping label in a background tab
    if (hasTracking) {
      window.open(`/api/admin/orders/${orderId}/delhivery-label`, '_blank');
    }
    // Trigger packing slip print
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleMarkPacked = async () => {
    setPacking(true);
    setPackMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-packed`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark order as packed');
      }
      setPacked(true);
      setPackMsg(data.message || 'Parcel verified and marked as packed!');
    } catch (err: any) {
      setPackMsg(err?.message || 'Error marking order as packed');
    } finally {
      setPacking(false);
    }
  };

  return (
    <div className="no-print w-full mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </Link>
        <span className="text-xs text-slate-500 font-medium">
          Packing Slip for Order <strong className="text-slate-900 dark:text-white">#{orderNumber}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Packing Confirmation Action */}
        {packed ? (
          <span
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
            title={packedAt ? `Packed: ${new Date(packedAt).toLocaleString()} by ${packedBy || 'Staff'}` : 'Packed'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Packed & Ready for Pickup</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleMarkPacked}
            disabled={packing}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Affirm that goods are packed in parcel with shipping label attached"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>{packing ? 'Saving...' : 'Mark as Packed'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handlePrintPackingSlip}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Slip</span>
        </button>

        {hasTracking ? (
          <>
            <button
              type="button"
              onClick={handlePrintDelhiveryLabel}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBoth}
              className="px-3.5 py-2 rounded-xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Prints website packing slip and opens Delhivery shipping label simultaneously"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Print Both</span>
            </button>
          </>
        ) : (
          <span
            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium"
            title="Manifest the order first to print official Delhivery courier label"
          >
            Label: Manifest Pending
          </span>
        )}
      </div>

      {packMsg && (
        <div className="w-full text-right text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {packMsg}
        </div>
      )}
    </div>
  );
}
