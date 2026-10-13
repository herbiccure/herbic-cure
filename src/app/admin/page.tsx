import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Package,
  ShoppingBag,
  Users,
  FileText,
  ShieldCheck,
  HelpCircle,
  Megaphone,
  ArrowRight,
  TrendingUp,
  LineChart,
  Target,
  Sparkles,
  BarChart3,
  Percent,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const [productCount, orders, subscriberCount] = await Promise.all([
    prisma.product.count(),
    prisma.order.findMany({
      select: {
        total: true,
        orderStatus: true,
        paymentStatus: true,
      },
    }),
    prisma.newsletterSubscriber.count(),
  ]);

  const orderCount = orders.length;
  const totalGmv = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = orderCount > 0 ? Math.round(totalGmv / orderCount) : 0;
  const paidOrdersCount = orders.filter(
    (o) => o.paymentStatus?.toUpperCase() === 'PAID' || o.orderStatus?.toUpperCase() === 'DELIVERED'
  ).length;
  const paymentFulfillmentRate = orderCount > 0 ? Math.round((paidOrdersCount / orderCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">
            Herbic Cure Administration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Storefront operations, catalog inventory, orders, customer management, and predictive intelligence.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition group shrink-0"
        >
          <LineChart className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
          <span>Executive Analytics Studio</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Featured Executive Analytics & Growth Cockpit */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 border border-emerald-500/30 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                Senior Data Analyst Suite Active
              </div>
              <h2 className="text-xl font-bold font-serif text-white">
                Growth Cockpit &amp; Predictive Forecasting Studio
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Live statistical telemetry tracking Gross Merchandise Value, 60-day multi-horizon predictive forecasts (P10/P50/P90), BCG growth-share matrix, stockout runway alerts, and real-time editable corporate OKRs.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
              <Link
                href="/admin/analytics"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <TrendingUp className="w-4 h-4" />
                Open Growth &amp; Predictions Studio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/50 rounded-2xl p-3 border border-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Lifetime GMV</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5">₹{totalGmv.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500">Gross revenue booked</p>
            </div>

            <div className="bg-slate-950/50 rounded-2xl p-3 border border-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Average Order Value</p>
              <p className="text-lg font-black text-white mt-0.5">₹{avgOrderValue.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500">Across {orderCount} customer carts</p>
            </div>

            <div className="bg-slate-950/50 rounded-2xl p-3 border border-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fulfillment / Paid Rate</p>
              <p className="text-lg font-black text-teal-400 mt-0.5">{paymentFulfillmentRate}%</p>
              <p className="text-[10px] text-slate-500">{paidOrdersCount} verified successful</p>
            </div>

            <div className="bg-slate-950/50 rounded-2xl p-3 border border-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Scenario Simulator</p>
              <p className="text-lg font-black text-amber-400 mt-0.5">Editable OKRs</p>
              <p className="text-[10px] text-slate-500">What-if ROAS &amp; Spend modeler</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{productCount}</p>
          <p className="text-[11px] text-rose-400 mt-1">Live in store catalog</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{orderCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pan-India shipments</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Subscribers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{subscriberCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">VIP Newsletter leads</p>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Management Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/analytics"
            className="p-5 bg-gradient-to-br from-emerald-950/30 to-slate-900 hover:bg-slate-800/80 border border-emerald-500/30 rounded-3xl transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-emerald-300 group-hover:text-emerald-200 transition flex items-center justify-between">
              Analytics &amp; Forecasting
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              P10/P50/P90 predictions, OKRs, BCG matrix, &amp; simulator.
            </p>
          </Link>

          <Link
            href="/admin/products"
            className="p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-3xl transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/20">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition flex items-center justify-between">
              Products
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add, update prices, inventory, and images.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-3xl transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition flex items-center justify-between">
              Orders
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Process dispatches, AWBs, and tracking.
            </p>
          </Link>

          <Link
            href="/admin/policies"
            className="p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-3xl transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition flex items-center justify-between">
              Legal Policies
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Live edit Terms, Privacy, Refunds, &amp; Shipping.
            </p>
          </Link>

          <Link
            href="/admin/announcements"
            className="p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-3xl transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition flex items-center justify-between">
              Announcement Bar
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure live ticker lines, speed &amp; colors.
            </p>
          </Link>
        </div>
      </div>

      {/* Storefront Link Banner */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center justify-between shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-white">Live Storefront Status</h3>
          <p className="text-xs text-slate-400 mt-0.5">Herbic Cure Ayurvedic Naturals e-commerce is online.</p>
        </div>
        <Link
          href="/"
          target="_blank"
          style={{ color: '#ffffff' }}
          className="px-4 py-2 bg-[#A84358] hover:bg-[#45363B] text-white-force text-xs font-bold rounded-xl transition-all shadow-md"
        >
          View Public Storefront →
        </Link>
      </div>
    </div>
  );
}
