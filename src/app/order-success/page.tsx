import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import OrderSuccessClient from './OrderSuccessClient';
import { CheckCircle2, Truck, ArrowRight, Clock } from 'lucide-react';


interface OrderSuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold font-serif">Order Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-xs font-bold text-[#A84358] underline">
          Return Home
        </Link>
      </div>
    );
  }

  let order:
    | (NonNullable<Awaited<ReturnType<typeof prisma.order.findFirst>>> & {
        items: Array<{
          id: string;
          productName: string;
          productImage?: string | null;
          price: number;
          quantity: number;
          total: number;
        }>;
        events: Array<{
          id: string;
          status: string;
          description: string;
          location?: string | null;
          timestamp: Date;
        }>;
      })
    | null = null;

  try {
    order = (await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    })) as any;
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold font-serif">Order Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-xs font-bold text-[#A84358] underline">
          Return Home
        </Link>
      </div>
    );
  }

  let address: any = {};
  try {
    address = JSON.parse(order.shippingAddress);
  } catch {
    address = { addressLine1: order.shippingAddress };
  }

  const isPrepaid = order.paymentMethod !== 'COD';
  const advanceAmount = Number((order as any).advanceAmount ?? 0);
  const codBalanceAmount = Number(
    (order as any).codBalanceAmount ?? (order.total - advanceAmount)
  );
  const isCodWithAdvance = order.paymentMethod === 'COD' && advanceAmount > 0;
  const isPaid = order.paymentStatus === 'PAID';
  const isPartiallyPaid = order.paymentStatus === 'PARTIALLY_PAID';
  const isOrderConfirmed =
    order.orderStatus === 'CONFIRMED' ||
    (!isPrepaid && !isCodWithAdvance) ||
    isPaid ||
    isPartiallyPaid;

  return (
    <div className="bg-[#FCF8F9] min-h-screen py-12 sm:py-16">
      <OrderSuccessClient />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner: Confirmed vs Payment Pending */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 text-center shadow-sm space-y-4">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full flex items-center justify-center animate-scaleIn ${isOrderConfirmed ? 'bg-rose-100 text-[#A84358]' : 'bg-amber-100 text-amber-700'
              }`}
          >
            {isOrderConfirmed ? (
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
            ) : (
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
            {isOrderConfirmed
              ? 'Thank You! Your Order is Confirmed'
              : 'Payment Incomplete / Awaiting Confirmation'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
            {isOrderConfirmed ? (
              <>
                Order <strong className="text-[#A84358] font-mono">{order.orderNumber}</strong> has been successfully placed.
                {order.customerEmail && !order.customerEmail.includes('@herbiccure.com') ? (
                  <> We have sent the confirmation invoice to <strong>{order.customerEmail}</strong>.</>
                ) : (
                  <> Order updates &amp; live tracking will be sent to your mobile <strong>{order.customerPhone}</strong> via SMS &amp; WhatsApp.</>
                )}
              </>
            ) : (
              <>
                Payment for Order <strong className="text-[#A84358] font-mono">{order.orderNumber}</strong> has not yet been received. If your account was debited, the order will automatically confirm once Razorpay sends payment confirmation.
              </>
            )}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isOrderConfirmed ? (
              <Link
                href={`/track-order?orderId=${encodeURIComponent(order.orderNumber)}`}
                className="px-6 py-3 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>Track Your Package</span>
              </Link>
            ) : (
              <Link
                href="/checkout"
                className="px-6 py-3 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Return to Checkout</span>
              </Link>
            )}

            <Link
              href="/products"
              className="px-6 py-3 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                Order Reference
              </span>
              <p className="text-base font-extrabold font-mono text-stone-900">
                {order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                Payment Status
              </span>
              <p className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full mt-0.5">
                {isCodWithAdvance
                  ? (order.paymentStatus === 'PARTIALLY_PAID' || order.paymentStatus === 'PAID'
                    ? 'COD • Advance Paid'
                    : 'COD • Advance Pending')
                  : `${order.paymentMethod} • ${order.paymentStatus}`}
              </p>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
            <div>
              <span className="font-bold text-stone-900 block mb-1">Delivering To:</span>
              <p className="font-semibold text-stone-800">{order.customerName}</p>
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>{address.city}, {address.state} - {address.pinCode}</p>
              <p className="mt-1 font-mono text-stone-500">{order.customerPhone}</p>
            </div>

            <div>
              <span className="font-bold text-stone-900 block mb-1">Carrier & Shipping:</span>
              <p className="text-stone-800 font-semibold">{order.carrier || 'Delhivery Express'}</p>
              <p className="text-rose-700 font-medium">
                {order.trackingNumber
                  ? `AWB #${order.trackingNumber}`
                  : 'Order confirmed, shipment being prepared'}
              </p>
              <p className="text-stone-500 text-[11px] mt-2">
                {order.trackingNumber
                  ? 'Tracking link sent to your phone and email.'
                  : 'Live AWB tracking number will be sent via SMS and WhatsApp once dispatched.'}
              </p>
            </div>
          </div>

          {/* Purchased Items */}
          <div className="border-t border-stone-100 pt-4">
            <span className="font-bold text-stone-900 text-xs block mb-3">Purchased Items:</span>
            <div className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
                      <Image
                        src={item.productImage || '/images/banners/banner-1.png'}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-800">{item.productName}</h4>
                      <p className="text-stone-500">Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                  </div>
                  <span className="font-bold text-stone-900">₹{item.total}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-100">
                <span>Total Order Value</span>
                <span className="text-[#A84358]">₹{order.total}</span>
              </div>
              {isCodWithAdvance && (
                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span>Advance Paid Online</span>
                    <span>₹{advanceAmount}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-stone-800 p-1">
                    <span>Remaining Balance Due on Delivery</span>
                    <span>₹{codBalanceAmount}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

