'use client';

import React from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, ExternalLink, Layers } from 'lucide-react';

interface PackingSlipActionsProps {
  orderId: string;
  orderNumber: string;
  hasTracking: boolean;
}

export function PackingSlipActions({
  orderId,
  orderNumber,
  hasTracking,
}: PackingSlipActionsProps) {
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

  return (
    <div className="no-print w-full mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
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
        <button
          type="button"
          onClick={handlePrintPackingSlip}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Packing Slip</span>
        </button>

        {hasTracking ? (
          <>
            <button
              type="button"
              onClick={handlePrintDelhiveryLabel}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Print Delhivery Label</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBoth}
              className="px-4 py-2 rounded-xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
            Delhivery Label: Manifest Pending
          </span>
        )}
      </div>
    </div>
  );
}
