'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { XCircle, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  trackingNumber?: string | null;
}

const COMMON_REASONS = [
  'Ordered by mistake',
  'Want to change shipping address or phone',
  'Want to add/remove products from cart',
  'Delivery time is longer than expected',
  'Change payment method',
  'Other reasons',
];

export default function CancelOrderButton({
  orderId,
  orderNumber,
  orderStatus,
  trackingNumber,
}: CancelOrderButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);

  // If already cancelled or delivered, do not show cancellation option
  const nonCancellable = ['CANCELLED', 'DELIVERED', 'RETURNED', 'REFUNDED'];
  if (nonCancellable.includes(orderStatus)) {
    return null;
  }

  const handleCancelOrder = async () => {
    const finalReason =
      selectedReason === 'Other reasons' && customNote.trim()
        ? customNote.trim()
        : selectedReason;

    setLoading(true);
    const toastId = toast.loading('Contacting Delhivery & cancelling order...');

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Order successfully cancelled and logistics stopped', {
          id: toastId,
        });
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to cancel order. Please contact customer support.', {
          id: toastId,
        });
      }
    } catch {
      toast.error('Network error while cancelling order', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 bg-rose-50/60 hover:bg-rose-100 hover:border-rose-400 text-xs font-bold transition-colors cursor-pointer"
      >
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>Cancel Order</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 font-serif">Cancel Order?</h3>
                <p className="text-xs text-stone-500 font-mono">Reference #{orderNumber}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Delhivery Express Cancellation</span>
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Cancelling this order will immediately notify Delhivery Express to stop shipment dispatch
                {trackingNumber ? ` for AWB #${trackingNumber}` : ''}.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                Reason for cancellation
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:border-rose-500"
              >
                {COMMON_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {selectedReason === 'Other reasons' && (
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Please specify your reason..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:border-rose-500"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCancelOrder}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
