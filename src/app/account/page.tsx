'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Package,
  Truck,
  LogOut,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  total: number;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export default function AccountPage() {
  const router = useRouter();
  const { customer, logout, isLoading } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push('/account/login');
      return;
    }

    if (customer?.email) {
      fetch(`/api/orders/user?email=${encodeURIComponent(customer.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.orders) setOrders(data.orders);
        })
        .catch((e) => console.error('Failed to load user orders', e))
        .finally(() => setLoadingOrders(false));
    }
  }, [customer, isLoading, router]);

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center text-xs text-stone-500">
        Loading customer dashboard...
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="bg-[#FCF8F9] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-3 py-1 rounded-full">
              Customer Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900 mt-2">
              Welcome, {customer.name}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">{customer.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="self-start sm:self-center px-4 py-2 border border-stone-300 text-stone-700 hover:text-red-600 hover:border-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer Profile Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-[#A84358] flex items-center justify-center font-bold text-lg">
                  {customer.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">{customer.name}</h3>
                  <span className="text-[11px] text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                    Active Member
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-3">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Email</span>
                  <p className="font-medium text-stone-800">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Phone</span>
                    <p className="font-medium text-stone-800">{customer.phone}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100">
                <Link
                  href="/products"
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-[#A84358] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Shop New Products</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Order History (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#A84358]" />
                  <span>Order History</span>
                </h3>
                <span className="text-xs text-stone-400 font-bold">
                  {orders.length} Total Orders
                </span>
              </div>

              {loadingOrders ? (
                <div className="py-12 text-center text-xs text-stone-400">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Package className="w-12 h-12 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-500">No orders placed yet with this account.</p>
                  <Link
                    href="/products"
                    className="inline-block px-5 py-2.5 bg-[#A84358] text-white text-xs font-bold rounded-xl"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {orders.map((o) => (
                    <div key={o.id} className="py-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            {o.orderNumber}
                          </span>
                          <span className="text-[11px] text-stone-400 ml-2">
                            {new Date(o.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#A84358] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            {o.orderStatus}
                          </span>
                          <Link
                            href={`/track-order?orderId=${encodeURIComponent(o.orderNumber)}`}
                            className="text-xs font-bold text-stone-700 hover:text-[#A84358] flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-2.5 py-0.5 rounded-full transition-colors"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Track</span>
                          </Link>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-stone-50 p-3 rounded-xl text-xs space-y-1.5">
                        {o.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-stone-700">
                            <span>{item.productName} (x{item.quantity})</span>
                            <span className="font-bold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                          <span>Total</span>
                          <span className="text-[#A84358]">₹{o.total}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
