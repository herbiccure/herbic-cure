'use client';

import React, { useState } from 'react';
import { Search, Truck, AlertCircle, ShoppingBag, Clock } from 'lucide-react';

interface TrackedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderStatus: string;
  carrier: string;
  trackingNumber: string;
  total: number;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  events: {
    id: string;
    status: string;
    description: string;
    location?: string | null;
    timestamp: string;
  }[];
}

export default function TrackOrderPage() {
  const [orderQuery, setOrderQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMessage('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(orderQuery.trim())}`);
      const data = await res.json();

      if (data.found && data.order) {
        setOrder(data.order);
      } else {
        setErrorMessage(data.message || 'No matching order found. Please check your Order ID.');
      }
    } catch {
      setErrorMessage('Unable to connect to logistics server. Please try again or contact WhatsApp support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF8F9] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-3 inline-block">
            Real-Time Logistics
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            TRACK YOUR SHIPMENT
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-md mx-auto">
            Enter your Herbic Cure Order ID (e.g. HC-10028) or registered 10-digit mobile number.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-xl">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. HC-10028 or 9876543210"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              required
              className="flex-1 bg-stone-50 border border-stone-300 rounded-2xl px-5 py-3.5 text-xs sm:text-sm text-stone-900 focus:border-[#A84358] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-[#A84358] hover:bg-[#45363B] text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Track Order'}</span>
            </button>
          </form>

          {searched && !loading && (
            <div className="mt-8 pt-8 border-t border-stone-100 animate-in fade-in duration-300 space-y-6">
              {order ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-rose-50 p-4 sm:p-5 rounded-2xl border border-rose-200 gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#A84358] text-white flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-stone-900">
                            Order {order.orderNumber}
                          </h4>
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full uppercase">
                            {order.trackingNumber
                              ? order.orderStatus
                              : 'Order confirmed, shipment being prepared'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Carrier: {order.carrier || 'Delhivery Express'} • AWB: {order.trackingNumber ? (
                            <strong className="font-mono text-stone-800">{order.trackingNumber}</strong>
                          ) : (
                            <span className="text-amber-800 font-medium">Order confirmed, shipment being prepared</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs text-stone-500 block">Recipient</span>
                      <span className="text-xs font-bold text-stone-900">{order.customerName}</span>
                    </div>
                  </div>

                  {/* Items in shipment */}
                  {order.items && order.items.length > 0 && (
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
                      <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-stone-500" />
                        <span>Package Contents ({order.items.length} items)</span>
                      </h5>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs text-stone-600">
                            <span>{item.productName} × {item.quantity}</span>
                            <span className="font-semibold text-stone-800">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracking Timeline */}
                  <div>
                    <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span>Tracking Milestones</span>
                    </h5>
                    <div className="space-y-6 pl-4 border-l-2 border-rose-600 ml-3">
                      {order.events.map((ev, idx) => (
                        <div key={ev.id || idx} className="relative">
                          <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full ring-4 ring-white ${idx === 0 ? 'bg-rose-600 animate-pulse' : 'bg-stone-400'}`} />
                          <p className="text-xs font-bold text-stone-900">{ev.description}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {ev.location && `${ev.location} • `}
                            {new Date(ev.timestamp).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-bold text-amber-900">Shipment Lookup Notice</h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                    {errorMessage}
                  </p>
                  <p className="text-[11px] text-stone-500 pt-2">
                    Need help? Contact our customer care directly on WhatsApp at <strong>+91 93072 90518</strong>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
