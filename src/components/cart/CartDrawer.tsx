'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag, Check, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
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

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  if (!isCartOpen) return null;

  const neededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplying(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await fetch(`/api/coupons/verify?code=${encodeURIComponent(couponCode.trim().toUpperCase())}`);
      const data = await res.json();
      if (res.ok && data.coupon) {
        applyCoupon({
          code: data.coupon.code,
          discountValue: data.coupon.discountValue,
          discountType: data.coupon.discountType,
        });
        setCouponSuccess(`Coupon ${data.coupon.code} applied!`);
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid or expired coupon code.');
      }
    } catch {
      // Local fallback for pre-seeded codes
      const code = couponCode.trim().toUpperCase();
      if (code === 'HERBIC10') {
        applyCoupon({ code: 'HERBIC10', discountValue: 10, discountType: 'PERCENTAGE' });
        setCouponSuccess('Coupon HERBIC10 applied (10% off)!');
        setCouponCode('');
      } else if (code === 'GROWTH100' && subtotal >= 799) {
        applyCoupon({ code: 'GROWTH100', discountValue: 100, discountType: 'FIXED' });
        setCouponSuccess('Coupon GROWTH100 applied (₹100 off)!');
        setCouponCode('');
      } else {
        setCouponError('Invalid coupon code. Try HERBIC10');
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#A84358]" />
              <h2 className="text-lg font-bold text-gray-900">Your Herbal Cart</h2>
              <span className="bg-[#A84358] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/50 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free shipping progress bar */}
          <div className="p-4 bg-rose-50/60 border-b border-rose-100/80">
            {neededForFreeShipping > 0 ? (
              <p className="text-xs text-rose-950 font-medium mb-1.5 flex items-center justify-between">
                <span>
                  Add <strong className="text-[#A84358]">₹{neededForFreeShipping}</strong> more for <strong>FREE Delivery</strong>!
                </span>
                <span className="text-rose-700">{progressPercent}%</span>
              </p>
            ) : (
              <p className="text-xs text-[#A84358] font-bold flex items-center gap-1.5 mb-1.5">
                <Check className="w-4 h-4 text-rose-600 stroke-[3]" />
                <Sparkles className="w-4 h-4 text-emerald-600 inline shrink-0" /> You have unlocked FREE Express Delivery!
              </p>
            )}
            <div className="w-full bg-rose-200/50 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#A84358] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-rose-50 text-[#A84358] rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 opacity-70" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Your cart is empty</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Explore our bestselling 21 Ayurvedic herbs hair oils and therapy combos.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 inline-flex items-center justify-center px-6 py-2.5 bg-[#A84358] text-white rounded-lg text-sm font-semibold hover:bg-[#45363B] transition-all shadow-md shadow-rose-950/10"
                >
                  Explore Best Sellers
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-3.5 group">
                  <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                    <Image
                      src={item.image || '/images/banners/banner-1.png'}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs sm:text-sm font-bold text-gray-800 hover:text-[#A84358] line-clamp-2 leading-snug"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-[#A84358]">
                          ₹{item.price}
                        </span>
                        {item.regularPrice && item.regularPrice > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{item.regularPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 text-gray-600 rounded-l transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 text-gray-600 rounded-r transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-gray-600">
                        Total: ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout if items exist */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-200 bg-stone-50 space-y-3.5">
              {/* Coupon Form */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 text-[#A84358] font-medium">
                      <Tag className="w-4 h-4" />
                      <span>
                        Applied: <strong>{appliedCoupon.code}</strong> (-₹{discountAmount})
                      </span>
                    </div>
                    <button
                      onClick={() => { removeCoupon(); toast.info("Coupon removed"); }}
                      className="text-red-500 hover:text-red-700 font-semibold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. HERBIC10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 uppercase placeholder:normal-case focus:outline-hidden focus:border-[#A84358]"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !couponCode.trim()}
                      className="px-3.5 py-2 bg-[#A84358] text-white text-xs font-semibold rounded-lg hover:bg-[#45363B] disabled:opacity-50 transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-rose-600 mt-1">{couponSuccess}</p>}
              </div>

              {/* Price summary */}
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-700 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shippingFee === 0 ? (
                      <strong className="text-[#A84358] uppercase">FREE</strong>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                  <span>Estimated Total</span>
                  <span className="text-[#A84358] text-base">₹{finalTotal}</span>
                </div>
              </div>

              {/* Direct Checkout Button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3.5 bg-[#A84358] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#45363B] transition-all shadow-lg shadow-rose-950/20 active:scale-[0.99]"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  100% Ayurvedic Guarantee
                </span>
                <span>•</span>
                <span>Cash on Delivery Available</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
