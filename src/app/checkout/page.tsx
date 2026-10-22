'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Truck,
  ArrowRight,
  ShoppingBag,
  Banknote,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { checkoutSchema } from '@/lib/schemas/checkout';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    discountAmount,
    shippingFee,
    finalTotal,
    freeShippingThreshold,
    standardShippingFee,
    clearCart,
  } = useCart();
  const { customer, isLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Delhivery live pincode serviceability state
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [delhiveryStatus, setDelhiveryStatus] = useState<{
    checked: boolean;
    serviceable: boolean;
    message: string;
    expectedDeliveryDays?: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'COD' as 'COD' | 'RAZORPAY' | 'ONLINE' | 'UPI' | 'CARD',
  });

  React.useEffect(() => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || customer.name || '',
        email: prev.email || customer.email || '',
        phone: prev.phone || customer.phone || '',
      }));
    }
  }, [customer]);

  // Live Delhivery postal serviceability check
  React.useEffect(() => {
    const cleanPin = formData.pincode.trim();
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      let cancelled = false;
      setPincodeChecking(true);
      fetch('/api/shipping/delhivery/serviceability?pincode=' + cleanPin)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.serviceable) {
            setDelhiveryStatus({
              checked: true,
              serviceable: true,
              message: 'Delhivery Express available to ' + (data.city || 'your area') + ' (Est. ' + (data.expectedDeliveryDays || '2-4') + ' days)',
              expectedDeliveryDays: data.expectedDeliveryDays,
            });
          } else {
            setDelhiveryStatus({
              checked: true,
              serviceable: false,
              message: 'Standard Pan-India courier delivery active',
            });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDelhiveryStatus({
              checked: true,
              serviceable: true,
              message: 'Delhivery Express shipping available',
            });
          }
        })
        .finally(() => {
          if (!cancelled) setPincodeChecking(false);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setDelhiveryStatus(null);
    }
  }, [formData.pincode]);

  // Delivery charge: Free when order >= freeShippingThreshold (₹499), standard fee (₹89) when under
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const currentShippingFee = isFreeShipping ? 0 : standardShippingFee;
  const currentFinalTotal = Math.max(0, subtotal - discountAmount + currentShippingFee);

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
          shippingFee: currentShippingFee,
          total: currentFinalTotal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        clearCart();

        // If Razorpay payment session returned
        if (data.razorpayOrderId) {
          toast.success('Opening secure Razorpay checkout...');
          try {
            if (typeof (window as any).Razorpay !== 'undefined') {
              const options = {
                key: data.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.razorpayAmount,
                currency: data.razorpayCurrency || 'INR',
                name: 'Herbic Cure',
                description: '21 Herbs Ayurvedic Hair Care',
                order_id: data.razorpayOrderId,
                prefill: {
                  name: formData.name,
                  email: formData.email,
                  contact: formData.phone,
                },
                theme: {
                  color: '#8C3A4F',
                },
                handler: async function (response: any) {
                  try {
                    const verifyRes = await fetch('/api/payment/razorpay/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        orderId: data.orderId,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                      }),
                    });

                    if (verifyRes.ok) {
                      toast.success('Payment verified successfully!');
                      router.push('/order-success?orderId=' + data.orderId);
                    } else {
                      const vErr = await verifyRes.json().catch(() => ({}));
                      toast.error(vErr.error || 'Payment verification failed');
                      router.push('/checkout?error=Payment+verification+failed');
                    }
                  } catch (vEx) {
                    console.error('Payment verification error:', vEx);
                    router.push('/order-success?orderId=' + data.orderId);
                  }
                },
                modal: {
                  ondismiss: function () {
                    toast.info('Payment window closed. You can complete your order anytime.');
                    setLoading(false);
                  },
                },
              };

              const rzp = new (window as any).Razorpay(options);
              rzp.open();
              return;
            } else {
              toast.error('Razorpay SDK is loading, please try again in a moment.');
              setLoading(false);
              return;
            }
          } catch (sdkErr) {
            console.error('Razorpay SDK invocation error:', sdkErr);
            toast.error('Failed to launch Razorpay payment.');
            setLoading(false);
            return;
          }
        }

        toast.success('Order confirmed successfully!');
        router.push(
          '/order-success?orderId=' + (data.orderId || ('HC-' + Date.now().toString().slice(-6)))
        );
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#FCF8F9]">
        <div className="w-16 h-16 rounded-3xl bg-[#F6DFE7] text-[#8C3A4F] flex items-center justify-center mb-5 border border-[#EAC9D1]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#2D1B1B] font-serif tracking-tight">Your Bag is Empty</h2>
        <p className="text-xs text-[#7A5B64] mt-2 max-w-sm leading-relaxed">
          Select our authentic 21 Herbs Hair Oil or Vedic hair care rituals before heading to checkout.
        </p>
        <Link
          href="/products"
          className="mt-6 px-7 py-3.5 rounded-full bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold shadow-md shadow-rose-900/10 transition-all inline-flex items-center gap-2"
        >
          <span>Explore Formulations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF8F9] py-8 sm:py-12">
      {/* Load Razorpay Web SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Breadcrumb */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A5B64] hover:text-[#8C3A4F] transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B1B] font-serif tracking-tight">
              SECURE AYURVEDIC CHECKOUT
            </h1>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#8C3A4F] bg-[#F6DFE7] px-3.5 py-1.5 rounded-full border border-[#EAC9D1] self-start sm:self-auto">
              <Lock className="w-3 h-3 shrink-0" />
              <span>256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Accordion for Order Summary */}
        <div className="lg:hidden mb-6 bg-white rounded-2xl border border-[#EAC9D1] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full px-5 py-4 flex items-center justify-between text-left bg-[#FCF4F7] border-b border-[#EAC9D1]/60"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-[#8C3A4F]" />
              <span className="text-xs font-bold text-[#2D1B1B]">
                {mobileSummaryOpen ? 'Hide' : 'Show'} Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
              {mobileSummaryOpen ? (
                <ChevronUp className="w-4 h-4 text-[#7A5B64]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#7A5B64]" />
              )}
            </div>
            <span className="text-sm font-bold text-[#8C3A4F]">₹{currentFinalTotal}</span>
          </button>

          {mobileSummaryOpen && (
            <div className="p-5 space-y-4">
              <div className="divide-y divide-[#F2DFE4] max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#EAC9D1]/60">
                      <Image
                        src={item.image || '/images/banners/banner-1.png'}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#2D1B1B] truncate">{item.name}</h4>
                      <p className="text-[11px] text-[#7A5B64]">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-[#8C3A4F]">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#F2DFE4] space-y-1.5 text-xs text-[#543E36]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#2D1B1B]">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#8C3A4F]">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={`font-semibold ${currentShippingFee === 0 ? 'text-emerald-700' : 'text-[#8C3A4F]'}`}>
                    {currentShippingFee === 0 ? 'FREE' : ('₹' + currentShippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#2D1B1B] pt-2 border-t border-[#F2DFE4]">
                  <span>Total Due</span>
                  <span className="text-[#8C3A4F]">₹{currentFinalTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-10 items-start">
          {/* Checkout Form Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAC9D1] shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F2DFE4]">
              <span className="w-7 h-7 rounded-full bg-[#8C3A4F] text-white text-xs flex items-center justify-center font-bold shrink-0 shadow-xs">
                1
              </span>
              <div>
                <h2 className="text-base font-bold text-[#2D1B1B]">Shipping &amp; Delivery Details</h2>
                <p className="text-[11px] text-[#7A5B64] mt-0.5">Where should we deliver your authentic Ayurvedic package?</p>
              </div>
            </div>

            {customer && (
              <div className="mb-6 p-4 rounded-2xl bg-[#FCF4F7] border border-[#EAC9D1] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#8C3A4F] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {customer.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2D1B1B]">{customer.name}</span>
                      <span className="text-[9px] font-bold text-[#8C3A4F] bg-white px-2 py-0.5 rounded-full border border-[#EAC9D1]">
                        Verified Customer
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A5B64] mt-0.5">{customer.email}</p>
                  </div>
                </div>
                <Link
                  href="/account"
                  className="text-xs font-semibold text-[#8C3A4F] hover:underline"
                >
                  My Account
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#45363B] mb-1.5">
                    Full Name <span className="text-[#8C3A4F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-[#FAF5F7] hover:bg-white focus:bg-white border border-[#E2CBD2] rounded-xl px-4 py-3 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#45363B] mb-1.5">
                    Phone Number (SMS &amp; WhatsApp Tracking) <span className="text-[#8C3A4F]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full bg-[#FAF5F7] hover:bg-white focus:bg-white border border-[#E2CBD2] rounded-xl px-4 py-3 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45363B] mb-1.5">
                  Email Address <span className="text-[#7A5B64] font-normal text-[11px]">(Optional - for invoice copy)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    readOnly={Boolean(customer?.email)}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com (Optional)"
                    className={'w-full bg-[#FAF5F7] border border-[#E2CBD2] rounded-xl px-4 py-3 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] outline-none transition-all ' + (
                      customer?.email
                        ? 'cursor-not-allowed bg-stone-100/70 text-stone-600'
                        : 'focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 hover:bg-white focus:bg-white'
                    )}
                  />
                  {customer?.email && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45363B] mb-1.5">
                  Delivery Address (Flat / House No, Street, Landmark) <span className="text-[#8C3A4F]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete shipping address"
                  className="w-full bg-[#FAF5F7] hover:bg-white focus:bg-white border border-[#E2CBD2] rounded-xl px-4 py-3 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#45363B] mb-1.5">
                    City <span className="text-[#8C3A4F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full bg-[#FAF5F7] hover:bg-white focus:bg-white border border-[#E2CBD2] rounded-xl px-4 py-3 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#45363B] mb-1.5">
                    State <span className="text-[#8C3A4F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full bg-[#FAF5F7] hover:bg-white focus:bg-white border border-[#E2CBD2] rounded-xl px-4 py-3 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#45363B] mb-1.5">
                    PIN Code <span className="text-[#8C3A4F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="6-digit PIN"
                    className="w-full bg-[#FAF5F7] hover:bg-white focus:bg-white border border-[#E2CBD2] rounded-xl px-4 py-3 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 outline-none transition-all"
                  />
                  {/* Delhivery Live Pincode Serviceability Indicator */}
                  {pincodeChecking && (
                    <p className="text-[10px] text-[#8C3A4F] mt-1.5 flex items-center gap-1 font-medium animate-pulse">
                      <Truck className="w-3 h-3 animate-bounce" /> Checking Delhivery logistics...
                    </p>
                  )}
                  {!pincodeChecking && delhiveryStatus && (
                    <p
                      className={'text-[10px] mt-1.5 flex items-center gap-1 font-medium ' + (
                        delhiveryStatus.serviceable ? 'text-emerald-700' : 'text-amber-800'
                      )}
                    >
                      <Truck className="w-3 h-3 shrink-0" />
                      <span>{delhiveryStatus.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="pt-5 border-t border-[#F2DFE4]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#2D1B1B] uppercase tracking-wide">
                    Select Payment Method
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Safe &amp; Protected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label
                    className={'flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ' + (
                      formData.paymentMethod === 'COD'
                        ? 'border-[#8C3A4F] bg-[#FCF4F7] ring-2 ring-[#8C3A4F]/20 shadow-xs'
                        : 'border-[#EAC9D1] bg-white hover:bg-[#FCF8F9]'
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === 'COD'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                      className="accent-[#8C3A4F] mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-[#8C3A4F]" />
                          <span className="block text-xs font-bold text-[#2D1B1B]">
                            Cash on Delivery (COD)
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isFreeShipping
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-[#8C3A4F] bg-[#F6DFE7] border-[#EAC9D1]'
                        }`}>
                          {isFreeShipping ? 'FREE Delivery' : `+₹${standardShippingFee} Delivery`}
                        </span>
                      </div>
                      <span className="block text-[11px] text-[#7A5B64] mt-1 leading-snug">
                        {isFreeShipping
                          ? `Pay cash or UPI to courier upon delivery (Free express shipping on orders above ₹${freeShippingThreshold})`
                          : `Pay cash or UPI to courier upon delivery (₹${standardShippingFee} courier charges applicable under ₹${freeShippingThreshold})`}
                      </span>
                    </div>
                  </label>

                  <label
                    className={'flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ' + (
                      formData.paymentMethod === 'RAZORPAY' ||
                      formData.paymentMethod === 'ONLINE' ||
                      formData.paymentMethod === 'UPI' ||
                      formData.paymentMethod === 'CARD'
                        ? 'border-[#8C3A4F] bg-[#FCF4F7] ring-2 ring-[#8C3A4F]/20 shadow-xs'
                        : 'border-[#EAC9D1] bg-white hover:bg-[#FCF8F9]'
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="RAZORPAY"
                      checked={
                        formData.paymentMethod === 'RAZORPAY' ||
                        formData.paymentMethod === 'ONLINE' ||
                        formData.paymentMethod === 'UPI' ||
                        formData.paymentMethod === 'CARD'
                      }
                      onChange={() => setFormData({ ...formData, paymentMethod: 'RAZORPAY' })}
                      className="accent-[#8C3A4F] mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-700" />
                          <span className="block text-xs font-bold text-[#2D1B1B]">
                            Prepaid (UPI / Card / NetBanking)
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isFreeShipping
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-[#8C3A4F] bg-[#F6DFE7] border-[#EAC9D1]'
                        }`}>
                          {isFreeShipping ? 'FREE Delivery' : `+₹${standardShippingFee} Delivery`}
                        </span>
                      </div>
                      <span className="block text-[11px] text-[#7A5B64] mt-1 leading-snug">
                        {isFreeShipping
                          ? `Pay via UPI, GPay, PhonePe, Cards or NetBanking (Free express delivery applied)`
                          : `Pay via UPI, GPay, PhonePe, Cards or NetBanking (₹${standardShippingFee} courier charges applicable under ₹${freeShippingThreshold})`}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8C3A4F] to-[#722E3F] hover:from-[#722E3F] hover:to-[#5A2230] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/20 active:scale-[0.99] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {loading ? 'Confirming Ayurvedic Order...' : ('PLACE ORDER • ₹' + currentFinalTotal)}
                  </span>
                </button>
                <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#7A5B64]">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#8C3A4F]" />
                    Delhivery Express Delivery
                  </span>
                  <span>•</span>
                  <span>Zero Hidden Charges</span>
                </div>
              </div>
            </form>
          </div>

          {/* Desktop Order Summary Sidebar (Sticky) */}
          <div className="hidden lg:block lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAC9D1] shadow-xs">
              <h2 className="text-base font-bold text-[#2D1B1B] mb-4 font-serif flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-sans font-semibold text-[#8C3A4F] bg-[#FCF4F7] px-2.5 py-0.5 rounded-full border border-[#EAC9D1]">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </h2>

              <div className="divide-y divide-[#F2DFE4] max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#EAC9D1]/70">
                      <Image
                        src={item.image || '/images/banners/banner-1.png'}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#2D1B1B] truncate">{item.name}</h4>
                      <p className="text-[11px] text-[#7A5B64] mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-[#8C3A4F] shrink-0">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#F2DFE4] space-y-2 text-xs text-[#543E36]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#2D1B1B]">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#8C3A4F]">
                    <span>Discount Applied</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Shipping Fee</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${currentShippingFee === 0 ? 'text-emerald-700 bg-emerald-50' : 'text-[#8C3A4F] bg-rose-50'}`}>
                    {currentShippingFee === 0 ? 'FREE' : ('₹' + currentShippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#2D1B1B] pt-3 border-t border-[#F2DFE4]">
                  <span>Total Amount</span>
                  <span className="text-[#8C3A4F] text-lg font-serif">₹{currentFinalTotal}</span>
                </div>
              </div>
            </div>

            {/* Authenticity Guarantee Card */}
            <div className="bg-[#FAF0F4] rounded-2xl p-4.5 border border-[#E8CAD2] flex items-start gap-3 shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-[#8C3A4F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-[#2D1B1B]">
                  Herbic Cure 100% Authenticity Guarantee
                </strong>
                <p className="text-[11px] text-[#543E36] mt-0.5 leading-relaxed">
                  Packed fresh with tamper-evident seal and genuine Kshirapak cold-processed herbs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
