'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  Truck, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    itemCount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
    shippingFee,
    finalTotal,
    freeShippingThreshold,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const neededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await fetch(`/api/coupons/verify?code=${encodeURIComponent(couponInput.trim().toUpperCase())}`);
      const data = await res.json();
      if (res.ok && data.coupon) {
        applyCoupon({
          code: data.coupon.code,
          discountValue: data.coupon.discountValue,
          discountType: data.coupon.discountType,
        });
        setCouponSuccess(`Coupon ${data.coupon.code} applied successfully!`);
        setCouponInput('');
      } else {
        setCouponError(data.error || 'Invalid or expired coupon.');
      }
    } catch {
      const code = couponInput.trim().toUpperCase();
      if (code === 'HERBIC10') {
        applyCoupon({ code: 'HERBIC10', discountValue: 10, discountType: 'PERCENTAGE' });
        setCouponSuccess('Coupon HERBIC10 applied (10% off)!');
        setCouponInput('');
      } else {
        setCouponError('Invalid coupon code. Try HERBIC10');
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-rose-50 text-[#A84358] rounded-full flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 opacity-80" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif">
          Your Herbal Cart is Empty
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-md mx-auto">
          Start your Ayurvedic hair care journey today with our clinically proven 21 herbs oil.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 bg-[#A84358] text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#45363B] transition-all shadow-md"
        >
          <span>Explore Best Sellers</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FCF8F9] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-6 border-b border-stone-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
              Your Shopping Bag
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              You have {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-stone-400 hover:text-red-500 font-semibold transition-colors"
          >
            Clear Entire Bag
          </button>
        </div>

        {/* Free Shipping Alert Bar */}
        <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-2xl mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-rose-950 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#A84358]" />
              {neededForFreeShipping > 0 ? (
                <>Add ₹{neededForFreeShipping} more to qualify for FREE COD Shipping! (Prepaid is 100% Free)</>
              ) : (
                <><Sparkles className="w-4 h-4 text-emerald-600 inline shrink-0 mr-1" /> Congratulations! You have unlocked FREE Express Delivery across India!</>
              )}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-rose-200/60 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#A84358] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Items Table: 8 Columns */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex gap-4 sm:gap-6 items-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
                    <Image
                      src={item.image || '/images/banners/banner-1.png'}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 80px, 96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm sm:text-base font-bold text-stone-900 hover:text-[#A84358] line-clamp-2 transition-colors"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm sm:text-base font-extrabold text-[#A84358]">
                        ₹{item.price}
                      </span>
                      {item.regularPrice && item.regularPrice > item.price && (
                        <span className="text-xs text-stone-400 line-through">
                          ₹{item.regularPrice}
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-stone-200 text-stone-600 rounded-l-xl transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-stone-200 text-stone-600 rounded-r-xl transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right hidden sm:block">
                    <span className="text-base font-extrabold text-stone-900">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A84358] hover:underline uppercase tracking-wider pt-2"
            >
              <span>← Continue Shopping</span>
            </Link>
          </div>

          {/* Summary Column: 4 Columns */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
              <h3 className="text-base font-bold font-serif text-stone-900">Order Summary</h3>

              {/* Coupon box */}
              <div>
                {appliedCoupon ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#A84358] font-medium">
                      <Tag className="w-4 h-4" />
                      <span>Coupon: <strong>{appliedCoupon.code}</strong> (-₹{discountAmount})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 text-xs border border-stone-300 rounded-xl px-3 py-2.5 uppercase focus:outline-hidden focus:border-[#A84358]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-rose-600 mt-1">{couponSuccess}</p>}
              </div>

              {/* Calculation list */}
              <div className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-4">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-stone-900">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Estimated Delivery</span>
                  <span className="text-emerald-700 font-bold uppercase text-xs">
                    FREE
                  </span>
                </div>
                <div className="pt-3 border-t border-stone-200 flex justify-between text-base font-extrabold text-stone-900">
                  <span>Total Amount</span>
                  <span className="text-[#A84358] text-xl">₹{finalTotal}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-4 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 active:scale-98 transition-all"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>100% Secure Checkout with Razorpay & COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
