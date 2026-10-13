import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Package,
  ShoppingBag,
  Users,
  FileText,
  Megaphone,
  ArrowRight,
  TrendingUp,
  LineChart,
  Sparkles,
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
    <div className="space-y-7">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#2D1B1B] dark:text-white tracking-tight">
            Herbic Cure Administration
          </h1>
          <p className="text-xs sm:text-sm text-[#7A5B64] dark:text-slate-400 mt-1">
            Storefront operations, catalog inventory, orders, customer management, and predictive intelligence.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold rounded-xl shadow-xs transition-all group shrink-0"
        >
          <LineChart className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <span>Executive Analytics Studio</span>
          <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Featured Executive Analytics & Growth Cockpit */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF0F4] via-white to-[#F5E6EC] dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/40 border border-[#E8CAD2] dark:border-emerald-500/30 p-6 sm:p-7 shadow-xs">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8C3A4F]/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6DFE7] dark:bg-emerald-500/15 border border-[#EAC9D1] dark:border-emerald-500/30 text-[11px] font-bold text-[#8C3A4F] dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                Senior Data Analyst Suite Active
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#2D1B1B] dark:text-white">
                Growth Cockpit &amp; Predictive Forecasting Studio
              </h2>
              <p className="text-xs sm:text-sm text-[#45363B] dark:text-slate-300 leading-relaxed font-normal">
                Live statistical telemetry tracking Gross Merchandise Value, 60-day multi-horizon predictive forecasts (P10/P50/P90), BCG growth-share matrix, stockout runway alerts, and real-time editable corporate OKRs.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
              <Link
                href="/admin/analytics"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-bold text-xs shadow-sm transition-all hover:scale-[1.02]"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Open Growth &amp; Predictions Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-[#E8CAD2]/60 dark:border-slate-800/80">
            <div className="bg-white/95 dark:bg-slate-950/60 rounded-2xl p-4 border border-[#E8CAD2] dark:border-slate-800/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] dark:text-slate-400">Lifetime GMV</p>
              <p className="text-xl sm:text-2xl font-black text-[#8C3A4F] dark:text-emerald-400 mt-1">₹{totalGmv.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-[#7A5B64] dark:text-slate-400 mt-0.5">Gross revenue booked</p>
            </div>

            <div className="bg-white/95 dark:bg-slate-950/60 rounded-2xl p-4 border border-[#E8CAD2] dark:border-slate-800/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] dark:text-slate-400">Average Order Value</p>
              <p className="text-xl sm:text-2xl font-black text-[#2D1B1B] dark:text-white mt-1">₹{avgOrderValue.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-[#7A5B64] dark:text-slate-400 mt-0.5">Across {orderCount} customer carts</p>
            </div>

            <div className="bg-white/95 dark:bg-slate-950/60 rounded-2xl p-4 border border-[#E8CAD2] dark:border-slate-800/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] dark:text-slate-400">Fulfillment / Paid Rate</p>
              <p className="text-xl sm:text-2xl font-black text-teal-700 dark:text-teal-400 mt-1">{paymentFulfillmentRate}%</p>
              <p className="text-[11px] text-[#7A5B64] dark:text-slate-400 mt-0.5">{paidOrdersCount} verified successful</p>
            </div>

            <div className="bg-white/95 dark:bg-slate-950/60 rounded-2xl p-4 border border-[#E8CAD2] dark:border-slate-800/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] dark:text-slate-400">Scenario Simulator</p>
              <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">Editable OKRs</p>
              <p className="text-[11px] text-[#7A5B64] dark:text-slate-400 mt-0.5">What-if ROAS &amp; Spend modeler</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E8CAD2] dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-[#7A5B64] dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#8C3A4F] dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#2D1B1B] dark:text-white mt-1">{productCount}</p>
          <p className="text-[11px] font-semibold text-[#8C3A4F] dark:text-rose-400 mt-1.5">Live in store catalog</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E8CAD2] dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-[#7A5B64] dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#2D1B1B] dark:text-white mt-1">{orderCount}</p>
          <p className="text-[11px] font-semibold text-[#8C3A4F] dark:text-amber-400 mt-1.5">Pan-India shipments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E8CAD2] dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-[#7A5B64] dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Subscribers</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#2D1B1B] dark:text-white mt-1">{subscriberCount}</p>
          <p className="text-[11px] font-semibold text-[#8C3A4F] dark:text-emerald-400 mt-1.5">VIP Newsletter leads</p>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A5B64] dark:text-slate-400 mb-3.5">
          Management Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            href="/admin/analytics"
            className="p-5 bg-white dark:bg-slate-900 hover:border-[#8C3A4F]/60 dark:hover:border-emerald-500/50 border border-[#E8CAD2] dark:border-slate-800 rounded-3xl transition group shadow-2xs hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-200/60 dark:border-emerald-500/30">
              <LineChart className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-white dark:group-hover:text-emerald-300 transition-colors flex items-center justify-between">
              Analytics &amp; Forecasting
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#7A5B64] dark:text-slate-400 mt-1.5 leading-relaxed">
              P10/P50/P90 predictions, OKRs, BCG matrix, &amp; simulator.
            </p>
          </Link>

          <Link
            href="/admin/products"
            className="p-5 bg-white dark:bg-slate-900 hover:border-[#8C3A4F]/60 dark:hover:border-rose-500/50 border border-[#E8CAD2] dark:border-slate-800 rounded-3xl transition group shadow-2xs hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#8C3A4F] dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center mb-3 border border-rose-200/60 dark:border-rose-500/20">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-white dark:group-hover:text-rose-400 transition-colors flex items-center justify-between">
              Products
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#7A5B64] dark:text-slate-400 mt-1.5 leading-relaxed">
              Add, update prices, inventory, and images.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="p-5 bg-white dark:bg-slate-900 hover:border-[#8C3A4F]/60 dark:hover:border-amber-500/50 border border-[#E8CAD2] dark:border-slate-800 rounded-3xl transition group shadow-2xs hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center mb-3 border border-amber-200/60 dark:border-amber-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-white dark:group-hover:text-amber-400 transition-colors flex items-center justify-between">
              Orders
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#7A5B64] dark:text-slate-400 mt-1.5 leading-relaxed">
              Process dispatches, AWBs, and tracking.
            </p>
          </Link>

          <Link
            href="/admin/policies"
            className="p-5 bg-white dark:bg-slate-900 hover:border-[#8C3A4F]/60 dark:hover:border-purple-500/50 border border-[#E8CAD2] dark:border-slate-800 rounded-3xl transition group shadow-2xs hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 flex items-center justify-center mb-3 border border-purple-200/60 dark:border-purple-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-white dark:group-hover:text-purple-400 transition-colors flex items-center justify-between">
              Legal Policies
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#7A5B64] dark:text-slate-400 mt-1.5 leading-relaxed">
              Live edit Terms, Privacy, Refunds, &amp; Shipping.
            </p>
          </Link>

          <Link
            href="/admin/announcements"
            className="p-5 bg-white dark:bg-slate-900 hover:border-[#8C3A4F]/60 dark:hover:border-blue-500/50 border border-[#E8CAD2] dark:border-slate-800 rounded-3xl transition group shadow-2xs hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center mb-3 border border-blue-200/60 dark:border-blue-500/20">
              <Megaphone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-white dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
              Announcement Bar
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-[#7A5B64] dark:text-slate-400 mt-1.5 leading-relaxed">
              Configure live ticker lines, speed &amp; colors.
            </p>
          </Link>
        </div>
      </div>

      {/* Storefront Link Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E8CAD2] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-[#2D1B1B] dark:text-white">Live Storefront Status</h3>
          <p className="text-xs text-[#7A5B64] dark:text-slate-400 mt-0.5">Herbic Cure Ayurvedic Naturals e-commerce is online.</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="px-5 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 inline-flex items-center gap-1.5"
        >
          <span>View Public Storefront</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </Link>
      </div>
    </div>
  );
}
