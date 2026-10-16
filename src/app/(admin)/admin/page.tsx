import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Package,
  ShoppingBag,
  Users,
  LineChart,
  TrendingUp,
  ArrowRight,
  Sparkles,
  FileText,
  Megaphone,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

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
  const totalGmv = orders.reduce((sum: number, o: { total: number | null }) => sum + (o.total || 0), 0);
  const avgOrderValue = orderCount > 0 ? Math.round(totalGmv / orderCount) : 0;
  const paidOrdersCount = orders.filter(
    (o: { paymentStatus: string | null; orderStatus: string | null }) =>
      o.paymentStatus?.toUpperCase() === 'PAID' || o.orderStatus?.toUpperCase() === 'DELIVERED'
  ).length;
  const paymentFulfillmentRate = orderCount > 0 ? Math.round((paidOrdersCount / orderCount) * 100) : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#2D1B1B] dark:text-[#FAF0F4] tracking-tight">
            Herbic Cure Administration
          </h1>
          <p className="text-xs sm:text-sm text-[#7A5B64] dark:text-[#CBB2BA] mt-1">
            Storefront operations, catalog inventory, orders, customer management, and predictive intelligence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/homepage"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FDF0F4] text-[#8C3A4F] border border-[#EAC9D1] text-xs font-bold rounded-xl shadow-2xs transition-all group shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[#8C3A4F] group-hover:rotate-12 transition-transform" />
            <span>Hero &amp; Homepage Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#8C3A4F] group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold rounded-xl shadow-xs transition-all group shrink-0"
          >
            <LineChart className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span className="text-white">Executive Analytics Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Featured Executive Analytics & Growth Cockpit */}
      <div className="admin-cockpit-container relative overflow-hidden rounded-3xl p-6 sm:p-7">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8C3A4F]/5 dark:bg-[#8C3A4F]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6DFE7] dark:bg-[#331E26] border border-[#EAC9D1] dark:border-[#4A323B] text-[11px] font-bold text-[#8C3A4F] dark:text-[#F4C9D5]">
                <Sparkles className="w-3.5 h-3.5" />
                Senior Data Analyst Suite Active
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#2D1B1B] dark:text-[#FAF0F4]">
                Growth Cockpit &amp; Predictive Forecasting Studio
              </h2>
              <p className="text-xs sm:text-sm text-[#45363B] dark:text-[#D8B2BA] leading-relaxed font-normal">
                Live statistical telemetry tracking Gross Merchandise Value, 60-day multi-horizon predictive forecasts (P10/P50/P90), BCG growth-share matrix, stockout runway alerts, and real-time editable corporate OKRs.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
              <Link
                href="/admin/analytics"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
              >
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-white">Open Growth &amp; Predictions Studio</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>

          <div className="admin-cockpit-divider grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 pt-6">
            <div className="admin-cockpit-card rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] dark:text-[#D8B2BA]">Lifetime GMV</p>
              <p className="admin-cockpit-num text-xl sm:text-2xl font-black text-[#8C3A4F] dark:text-[#FAF0F4] mt-1">₹{totalGmv.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-[#7A5B64] dark:text-[#CBB2BA] mt-0.5">Gross revenue booked</p>
            </div>

            <div className="admin-cockpit-card rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] dark:text-[#D8B2BA]">Average Order Value</p>
              <p className="admin-cockpit-num admin-stat-number text-xl sm:text-2xl font-black text-[#2D1B1B] dark:text-[#FAF0F4] mt-1">₹{avgOrderValue.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-[#7A5B64] dark:text-[#CBB2BA] mt-0.5">Across {orderCount} customer carts</p>
            </div>

            <div className="admin-cockpit-card rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] dark:text-[#D8B2BA]">Fulfillment / Paid Rate</p>
              <p className="admin-cockpit-num text-xl sm:text-2xl font-black text-[#8C3A4F] dark:text-[#FAF0F4] mt-1">{paymentFulfillmentRate}%</p>
              <p className="text-[11px] text-[#7A5B64] dark:text-[#CBB2BA] mt-0.5">{paidOrdersCount} verified successful</p>
            </div>

            <div className="admin-cockpit-card rounded-2xl p-5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] dark:text-[#D8B2BA]">Scenario Simulator</p>
              <p className="admin-cockpit-num text-xl sm:text-2xl font-black text-[#543E36] dark:text-[#FAF0F4] mt-1">Editable OKRs</p>
              <p className="text-[11px] text-[#7A5B64] dark:text-[#CBB2BA] mt-0.5">What-if ROAS &amp; Spend modeler</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="admin-kpi-card p-6 rounded-3xl shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-[#7A5B64] dark:text-[#D8B2BA] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center border border-[#EAC9D1] dark:border-[#4A323B]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="admin-stat-number text-3xl font-extrabold text-[#2D1B1B] dark:text-[#FAF0F4] mt-1">{productCount}</p>
          <p className="text-[11px] font-semibold text-[#8C3A4F] dark:text-[#F4C9D5] mt-1.5">Live in store catalog</p>
        </div>

        <div className="admin-kpi-card p-6 rounded-3xl shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-[#7A5B64] dark:text-[#D8B2BA] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center border border-[#EAC9D1] dark:border-[#4A323B]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="admin-stat-number text-3xl font-extrabold text-[#2D1B1B] dark:text-[#FAF0F4] mt-1">{orderCount}</p>
          <p className="text-[11px] font-semibold text-[#8C3A4F] dark:text-[#F4C9D5] mt-1.5">Pan-India shipments</p>
        </div>

        <div className="admin-kpi-card p-6 rounded-3xl shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-[#7A5B64] dark:text-[#D8B2BA] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Subscribers</span>
            <div className="w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center border border-[#EAC9D1] dark:border-[#4A323B]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="admin-stat-number text-3xl font-extrabold text-[#2D1B1B] dark:text-[#FAF0F4] mt-1">{subscriberCount}</p>
          <p className="text-[11px] font-semibold text-[#8C3A4F] dark:text-[#F4C9D5] mt-1.5">VIP Newsletter leads</p>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A5B64] dark:text-[#D8B2BA] mb-3.5">
          Management Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <Link
            href="/admin/analytics"
            className="admin-module-card p-5 rounded-3xl transition-all group shadow-2xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="admin-icon-box w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center mb-3 border border-[#EAC9D1] dark:border-[#4A323B]">
                <LineChart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-[#FAF0F4] dark:group-hover:text-rose-300 transition-colors flex items-center justify-between">
                <span>Analytics &amp; Forecasting</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
              </h3>
              <p className="text-xs text-[#7A5B64] dark:text-[#CBB2BA] mt-1.5 leading-relaxed">
                P10/P50/P90 predictions, OKRs, BCG matrix, &amp; simulator.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/homepage"
            className="admin-module-card p-5 rounded-3xl transition-all group shadow-2xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="admin-icon-box w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center mb-3 border border-[#EAC9D1] dark:border-[#4A323B]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-[#FAF0F4] dark:group-hover:text-rose-300 transition-colors flex items-center justify-between">
                <span>Hero &amp; Homepage Studio</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
              </h3>
              <p className="text-xs text-[#7A5B64] dark:text-[#CBB2BA] mt-1.5 leading-relaxed">
                Edit hero slides, upload images, add &amp; reorder sections.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="admin-module-card p-5 rounded-3xl transition-all group shadow-2xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="admin-icon-box w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center mb-3 border border-[#EAC9D1] dark:border-[#4A323B]">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-[#FAF0F4] dark:group-hover:text-rose-300 transition-colors flex items-center justify-between">
                <span>Products</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
              </h3>
              <p className="text-xs text-[#7A5B64] dark:text-[#CBB2BA] mt-1.5 leading-relaxed">
                Add, update prices, inventory, and images.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="admin-module-card p-5 rounded-3xl transition-all group shadow-2xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="admin-icon-box w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center mb-3 border border-[#EAC9D1] dark:border-[#4A323B]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-[#FAF0F4] dark:group-hover:text-rose-300 transition-colors flex items-center justify-between">
                <span>Orders</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
              </h3>
              <p className="text-xs text-[#7A5B64] dark:text-[#CBB2BA] mt-1.5 leading-relaxed">
                Process dispatches, AWBs, and tracking.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/policies"
            className="admin-module-card p-5 rounded-3xl transition-all group shadow-2xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="admin-icon-box w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center mb-3 border border-[#EAC9D1] dark:border-[#4A323B]">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-[#FAF0F4] dark:group-hover:text-rose-300 transition-colors flex items-center justify-between">
                <span>Legal Policies</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
              </h3>
              <p className="text-xs text-[#7A5B64] dark:text-[#CBB2BA] mt-1.5 leading-relaxed">
                Live edit Terms, Privacy, Refunds, &amp; Shipping.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/announcements"
            className="admin-module-card p-5 rounded-3xl transition-all group shadow-2xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="admin-icon-box w-9 h-9 rounded-xl bg-[#F6DFE7] text-[#8C3A4F] dark:bg-[#331E26] dark:text-[#FAF0F4] flex items-center justify-center mb-3 border border-[#EAC9D1] dark:border-[#4A323B]">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#2D1B1B] group-hover:text-[#8C3A4F] dark:text-[#FAF0F4] dark:group-hover:text-rose-300 transition-colors flex items-center justify-between">
                <span>Announcement Bar</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
              </h3>
              <p className="text-xs text-[#7A5B64] dark:text-[#CBB2BA] mt-1.5 leading-relaxed">
                Configure live ticker lines, speed &amp; colors.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Storefront Link Banner */}
      <div className="admin-storefront-banner p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-[#2D1B1B] dark:text-[#FAF0F4]">Live Storefront Status</h3>
          <p className="text-xs text-[#7A5B64] dark:text-[#CBB2BA] mt-0.5">Herbic Cure Ayurvedic Naturals e-commerce is online.</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="admin-storefront-btn px-5 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 inline-flex items-center gap-1.5"
        >
          <span className="text-white">View Public Storefront</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </Link>
      </div>
    </div>
  );
}
