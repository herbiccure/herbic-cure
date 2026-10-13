'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Truck, Check, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { checkoutSchema } from '@/lib/schemas/checkout';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discountAmount, shippingFee, finalTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'COD',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your shopping bag is empty');
      return;
    }

    const parsed = checkoutSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Please verify your delivery details');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          items,
          subtotal,
          discount: discountAmount,
          shippingFee,
          total: finalTotal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Order confirmed successfully!');
        clearCart();
        router.push(`/order-success?orderId=${data.orderId || 'HC-' + Date.now().toString().slice(-6)}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to process order');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-[#A84358] flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 font-serif">Your Bag is Empty</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Select our authentic 21 Herbs Hair Oil or combos before heading to checkout.
        </p>
        <Link
          href="/products"
          className="mt-6 px-6 py-3 rounded-full bg-[#A84358] text-white text-xs font-bold shadow-md hover:bg-[#45363B] transition-all"
        >
          Explore Formulations
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF8F9] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif mb-8 text-center sm:text-left">
          SECURE AYURVEDIC CHECKOUT
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Checkout Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md">
            <h2 className="text-base font-bold text-stone-900 mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#A84358] text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Shipping &amp; Delivery Details</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Recipient's Name"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:border-[#A84358] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number (for SMS &amp; WhatsApp Tracking) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:border-[#A84358] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="For invoice & order confirmation"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:border-[#A84358] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Delivery Address (Flat / House No, Street, Landmark) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete shipping address"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:border-[#A84358] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:border-[#A84358] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:border-[#A84358] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="6-digit PIN"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:border-[#A84358] outline-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-stone-200">
                <h3 className="text-xs font-bold text-stone-900 uppercase mb-3">
                  Payment Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === 'COD'
                        ? 'border-[#A84358] bg-rose-50/60 ring-2 ring-rose-600/20'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === 'COD'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="accent-[#A84358]"
                    />
                    <div>
                      <span className="block text-xs font-bold text-stone-900">
                        Cash on Delivery (COD)
                      </span>
                      <span className="block text-[10px] text-stone-500">Pay cash upon delivery</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === 'ONLINE'
                        ? 'border-[#A84358] bg-rose-50/60 ring-2 ring-rose-600/20'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={formData.paymentMethod === 'ONLINE'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="accent-[#A84358]"
                    />
                    <div>
                      <span className="block text-xs font-bold text-stone-900">
                        UPI / Card / NetBanking
                      </span>
                      <span className="block text-[10px] text-stone-500">Fast 100% Secure Checkout</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-[#A84358] hover:bg-[#45363B] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {loading ? 'Confirming Order...' : `PLACE ORDER • ₹${finalTotal}`}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md">
              <h2 className="text-base font-bold text-stone-900 mb-4 font-serif">
                Order Summary ({items.length} items)
              </h2>

              <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
                      <Image
                        src={item.image || '/images/banners/banner-1.png'}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-stone-800 truncate">{item.name}</h4>
                      <p className="text-[11px] text-stone-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-[#A84358]">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-800">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-stone-900">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-2 border-t border-stone-100">
                  <span>Total Amount</span>
                  <span className="text-[#A84358] text-base">₹{finalTotal}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#F6DFE7] rounded-2xl p-4 border border-stone-200 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[#A84358] shrink-0" />
              <p className="text-[11px] text-stone-700 leading-snug">
                <strong>Herbic Cure 100% Authenticity Guarantee:</strong> Packed fresh with tamper-evident seal and genuine Kshirapak cold-processed herbs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
