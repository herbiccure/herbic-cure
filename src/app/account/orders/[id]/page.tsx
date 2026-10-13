import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server';
import { getUserOrderById } from '@/data/user/orders';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/account/login');
  }

  const { id } = await params;
  const order = await getUserOrderById(session.user.id, id);

  // If order does not exist or belongs to another user, return 404 (IDOR safe)
  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[80vh]">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Orders</span>
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <span className="text-xs uppercase font-bold text-stone-500">Order Reference</span>
            <h1 className="text-2xl font-bold font-mono text-stone-900">{order.orderNumber}</h1>
            <p className="text-xs text-stone-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="sm:text-right">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.orderStatus === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.orderStatus === 'CANCELLED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.orderStatus}
            </span>
            <p className="text-sm font-bold text-stone-900 mt-2">
              Total: ₹{order.total?.toLocaleString('en-IN')} ({order.paymentMethod})
            </p>
          </div>
        </div>

        {/* Itemized Products */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-stone-100 text-sm">
                <div>
                  <p className="font-semibold text-stone-900">{item.productName}</p>
                  <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-mono font-bold text-stone-900">₹{item.total?.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Timeline */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 mb-4">Shipment Timeline</h2>
          {order.events && order.events.length > 0 ? (
            <div className="space-y-4">
              {order.events.map((ev, idx) => (
                <div key={ev.id || idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    {idx < order.events.length - 1 && <div className="w-0.5 h-full bg-emerald-200 mt-1" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{ev.status}</p>
                    <p className="text-xs text-stone-600">{ev.description}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {new Date(ev.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500">Shipment is being prepared at the apothecary fulfillment center.</p>
          )}
        </div>
      </div>
    </div>
  );
}
