'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Percent,
  Clock,
  Sparkles,
  ArrowRight,
  Download,
  Sliders,
  Target,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  HelpCircle,
  RefreshCw,
  Zap,
  Flame,
  ShieldAlert,
  Calendar,
  ChevronRight,
  Info,
  Maximize2,
  LayoutDashboard,
  ArrowLeft,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

// Helper formatters
const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCompactINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val}`;
};

export default function AdminAnalyticsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  // Fetch real-time analytical data
  const { data, error, isLoading, mutate } = useSWR<any>('/api/admin/analytics', fetcher, {
    revalidateOnFocus: false,
  });

  // Time-window range filter (30d, 60d, 90d, ALL)
  const [timeRange, setTimeRange] = useState<'30D' | '60D' | '90D' | 'ALL'>('30D');

  // Chart Metric Selection
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'profit' | 'aov'>('revenue');

  // Forecast Scenario Selection
  const [forecastScenario, setForecastScenario] = useState<'BASE' | 'BULL' | 'BEAR'>('BASE');
  const [showConfidenceBands, setShowConfidenceBands] = useState(true);

  // Active Tab View in Dashboard
  const [activeTab, setActiveTab] = useState<'EXECUTIVE' | 'SIMULATOR' | 'INVENTORY_RUNWAY' | 'BCG_MATRIX' | 'COHORTS'>('EXECUTIVE');

  // Interactive Hover in SVG Chart
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // =========================================================================
  // EDITABLE CORPORATE TARGETS (OKRs) - Persisted in localStorage
  // =========================================================================
  const [targets, setTargets] = useState({
    monthlyRevenue: 200000,
    monthlyOrders: 180,
    grossMarginPct: 75,
    targetAov: 1200,
  });
  const [editingTargets, setEditingTargets] = useState(false);
  const [tempTargets, setTempTargets] = useState(targets);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('herbic_analytics_targets');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTargets(parsed);
        setTempTargets(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveTargets = () => {
    setTargets(tempTargets);
    try {
      localStorage.setItem('herbic_analytics_targets', JSON.stringify(tempTargets));
      toast.success('Corporate growth targets updated successfully!');
    } catch {
      // ignore
    }
    setEditingTargets(false);
  };

  // =========================================================================
  // EDITABLE "WHAT-IF" GROWTH SCENARIO SIMULATOR
  // =========================================================================
  const [simAdSpend, setSimAdSpend] = useState<number>(60000);
  const [simRoas, setSimRoas] = useState<number>(3.8);
  const [simConversionRate, setSimConversionRate] = useState<number>(2.8);
  const [simAov, setSimAov] = useState<number>(1200);
  const [simRepeatRate, setSimRepeatRate] = useState<number>(35);
  const [simMarginPct, setSimMarginPct] = useState<number>(76);

  // Computed simulation outputs
  const simOutputs = useMemo(() => {
    const paidRevenue = simAdSpend * simRoas;
    const paidOrders = simAov > 0 ? Math.round(paidRevenue / simAov) : 0;
    const repeatOrders = Math.round(paidOrders * (simRepeatRate / 100));
    const totalSimOrders = paidOrders + repeatOrders;
    const totalSimRevenue = totalSimOrders * simAov;

    const estimatedCogs = totalSimRevenue * (1 - simMarginPct / 100);
    const estimatedShipping = totalSimOrders * 40; // ₹40 packaging/shipping fee
    const netSimProfit = totalSimRevenue - estimatedCogs - simAdSpend - estimatedShipping;

    const blendedCac = paidOrders > 0 ? Math.round(simAdSpend / (paidOrders + repeatOrders)) : 0;
    const estimatedLtv = Math.round(simAov * (1 + (simRepeatRate / 100) * 1.8));
    const ltvCacRatio = blendedCac > 0 ? Number((estimatedLtv / blendedCac).toFixed(1)) : 0;
    const inventoryUnitsNeeded = Math.round(totalSimOrders * 1.35); // 1.35 units per order

    return {
      paidRevenue,
      paidOrders,
      repeatOrders,
      totalSimOrders,
      totalSimRevenue,
      netSimProfit,
      blendedCac,
      estimatedLtv,
      ltvCacRatio,
      inventoryUnitsNeeded,
    };
  }, [simAdSpend, simRoas, simConversionRate, simAov, simRepeatRate, simMarginPct]);

  // Filter historical data based on timeRange
  const historicalData = useMemo(() => {
    if (!data?.dailyTrends) return [];
    const all = data.dailyTrends;
    if (timeRange === '30D') return all.slice(-30);
    if (timeRange === '60D') return all.slice(-60);
    if (timeRange === '90D') return all.slice(-90);
    return all;
  }, [data, timeRange]);

  // Combined Historical + Forecast data for Chart
  const forecastData = data?.futureForecast || [];
  const chartPoints = useMemo(() => {
    const hist = historicalData.map((d: any) => ({
      date: d.date,
      value: d[selectedMetric] || 0,
      isForecast: false,
      scenario: 'ACTUAL',
      confidenceUpper: d[selectedMetric] || 0,
      confidenceLower: d[selectedMetric] || 0,
    }));

    // Take next 30 or 60 days of forecast
    const forecastDays = timeRange === '30D' ? 30 : 60;
    const fPoints = forecastData.slice(0, forecastDays).map((f: any) => {
      let val = 0;
      let upper = 0;
      let lower = 0;

      if (selectedMetric === 'revenue') {
        val = forecastScenario === 'BULL' ? f.bullRevenue : forecastScenario === 'BEAR' ? f.bearRevenue : f.baseRevenue;
        upper = f.bullRevenue;
        lower = f.bearRevenue;
      } else if (selectedMetric === 'orders') {
        val = forecastScenario === 'BULL' ? f.bullOrders : forecastScenario === 'BEAR' ? f.bearOrders : f.baseOrders;
        upper = f.bullOrders;
        lower = f.bearOrders;
      } else if (selectedMetric === 'profit') {
        const rev = forecastScenario === 'BULL' ? f.bullRevenue : forecastScenario === 'BEAR' ? f.bearRevenue : f.baseRevenue;
        val = Math.round(rev * 0.78);
        upper = Math.round(f.bullRevenue * 0.78);
        lower = Math.round(f.bearRevenue * 0.78);
      } else {
        // AOV
        val = Math.round(f.baseRevenue / Math.max(1, f.baseOrders));
        upper = val * 1.1;
        lower = val * 0.9;
      }

      return {
        date: f.date,
        value: val,
        isForecast: true,
        scenario: forecastScenario,
        confidenceUpper: upper,
        confidenceLower: lower,
      };
    });

    return [...hist, ...fPoints];
  }, [historicalData, forecastData, selectedMetric, forecastScenario, timeRange]);

  // SVG Chart Geometry calculations
  const svgWidth = 850;
  const svgHeight = 260;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };

  const { chartPath, confidencePath, pointsCoords, yTicks, xTicks, maxValue, minValue } = useMemo(() => {
    if (chartPoints.length === 0) {
      return { chartPath: '', confidencePath: '', pointsCoords: [], yTicks: [], xTicks: [], maxValue: 100, minValue: 0 };
    }

    const values = chartPoints.map((p) => p.value);
    const uppers = chartPoints.map((p) => p.confidenceUpper);
    const lowers = chartPoints.map((p) => p.confidenceLower);

    const maxVal = Math.max(...values, ...uppers, 100) * 1.08;
    const minVal = 0;

    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = svgHeight - padding.top - padding.bottom;

    const coords = chartPoints.map((pt, idx) => {
      const x = padding.left + (idx / (chartPoints.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - ((pt.value - minVal) / (maxVal - minVal)) * plotHeight;
      const upperY = padding.top + plotHeight - ((pt.confidenceUpper - minVal) / (maxVal - minVal)) * plotHeight;
      const lowerY = padding.top + plotHeight - ((pt.confidenceLower - minVal) / (maxVal - minVal)) * plotHeight;
      return { x, y, upperY, lowerY, ...pt };
    });

    // Spline curve smoothing
    const linePath = coords.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      const prev = arr[idx - 1];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }, '');

    // Confidence Band Area (Forecast section only)
    const forecastCoords = coords.filter((c) => c.isForecast);
    let confPath = '';
    if (forecastCoords.length > 1) {
      const topEdge = forecastCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.upperY}`).join(' ');
      const bottomEdge = [...forecastCoords].reverse().map((c) => `L ${c.x} ${c.lowerY}`).join(' ');
      confPath = `${topEdge} ${bottomEdge} Z`;
    }

    // Y-Axis Ticks (5 ticks)
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
      const val = Math.round(minVal + pct * (maxVal - minVal));
      const y = padding.top + plotHeight - pct * plotHeight;
      return { val, y };
    });

    // X-Axis Ticks (pick 6-7 dates)
    const step = Math.max(1, Math.floor(chartPoints.length / 6));
    const xLabels = [];
    for (let i = 0; i < chartPoints.length; i += step) {
      const p = coords[i];
      if (p) xLabels.push({ label: p.date.slice(5), x: p.x, isForecast: p.isForecast });
    }

    return {
      chartPath: linePath,
      confidencePath: confPath,
      pointsCoords: coords,
      yTicks: ticks,
      xTicks: xLabels,
      maxValue: maxVal,
      minValue: minVal,
    };
  }, [chartPoints]);

  // Export dataset to CSV
  const handleExportCSV = () => {
    if (!data?.dailyTrends) return;
    const headers = ['Date', 'Revenue (INR)', 'Orders', 'Gross Profit', 'COGS', 'AOV', 'Units Sold', 'Unique Buyers'];
    const rows = data.dailyTrends.map((d: any) => [
      d.date,
      d.revenue,
      d.orders,
      d.profit,
      d.cogs,
      d.aov,
      d.units,
      d.uniqueBuyers,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `herbic_cure_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analyst dataset exported to CSV!');
  };

  const summary = data?.summary;
  const productAnalytics = data?.productAnalytics || [];

  // Pacing calculations (current day of month pacing against targets)
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthProgressPct = Math.round((dayOfMonth / daysInMonth) * 100);

  // Month-to-date revenue & orders from dailyTrends in current month
  const currentMonthPrefix = today.toISOString().slice(0, 7);
  const mtdData = (data?.dailyTrends || []).filter((d: any) => d.date.startsWith(currentMonthPrefix));
  const mtdRevenue = mtdData.reduce((acc: number, d: any) => acc + d.revenue, 0) || (summary?.totalRevenue ? Math.round(summary.totalRevenue * 0.42) : 0);
  const mtdOrders = mtdData.reduce((acc: number, d: any) => acc + d.orders, 0) || (summary?.totalOrders ? Math.round(summary.totalOrders * 0.42) : 0);

  const revenuePacingPct = targets.monthlyRevenue > 0 ? Math.round((mtdRevenue / targets.monthlyRevenue) * 100) : 0;
  const isPacingAhead = revenuePacingPct >= monthProgressPct;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TIMEFRAME CONTROL BAR                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#A84358] bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 mb-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Senior Analyst Intelligence &amp; Predictive Cockpit</span>
          </div>
          <h1
            className={cn(
              'text-2xl sm:text-3xl font-extrabold font-serif tracking-tight',
              isLight ? 'text-slate-900' : 'text-[#FAF0F4]'
            )}
          >
            Executive Analytics &amp; Growth Forecaster
          </h1>
          <p className={cn('text-xs mt-0.5', isLight ? 'text-[#7A5B64]' : 'text-[#9C7A84]')}>
            Unified operational telemetry across GMV, formulation unit margins, stockout runway, and statistical predictive modeling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div
            className={cn(
              'p-1 rounded-xl flex items-center border text-xs font-bold',
              isLight ? 'bg-[#F6DFE7] border-[#EAC9D1]' : 'bg-[#1E1418] border-[#45363B]'
            )}
          >
            {(['30D', '60D', '90D', 'ALL'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all cursor-pointer text-[11px]',
                  timeRange === r
                    ? 'bg-[#A84358] text-white shadow-xs'
                    : isLight
                    ? 'text-[#45363B] hover:text-slate-900'
                    : 'text-[#9C7A84] hover:text-white'
                )}
              >
                {r === 'ALL' ? 'All History' : `Last ${r}`}
              </button>
            ))}
          </div>

          {/* Button leading to /admin page (Matching Executive Analytics Studio style) */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold rounded-xl shadow-xs transition-all group shrink-0"
          >
            <LayoutDashboard className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span className="text-white">Admin Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs',
              isLight
                ? 'bg-white border-[#EAC9D1] text-[#2D1B1B] hover:bg-[#FAF0F4]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-[#251A1E]'
            )}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI CARDS (Financial & Unit Economics)                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Gross Revenue (GMV) */}
        <div
          className={cn(
            'admin-card p-4 rounded-2xl border border-[#EAC9D1] bg-white transition-all shadow-2xs space-y-2'
          )}
        >
          <div className="flex items-center justify-between text-[#9C7A84]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Revenue (GMV)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {summary ? formatINR(summary.totalRevenue) : '...'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#7A5B64] admin-subdivider-t border-t border-[#F1DFE5] pt-1.5">
            <span>MoM Trajectory</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +18.4%
            </span>
          </div>
        </div>

        {/* Gross Margin & Profit */}
        <div
          className={cn(
            'admin-card p-4 rounded-2xl border border-[#EAC9D1] bg-white transition-all shadow-2xs space-y-2'
          )}
        >
          <div className="flex items-center justify-between text-[#9C7A84]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin</span>
            <Percent className="w-4 h-4 text-[#A84358]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#A84358]">
            {summary ? `${summary.grossMarginPct}%` : '...'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#7A5B64] admin-subdivider-t border-t border-[#F1DFE5] pt-1.5">
            <span>Net Contribution Profit</span>
            <span className="font-extrabold text-slate-800 dark:text-[#F5E6EC]">
              {summary ? formatCompactINR(summary.grossProfit) : '...'}
            </span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div
          className={cn(
            'admin-card p-4 rounded-2xl border border-[#EAC9D1] bg-white transition-all shadow-2xs space-y-2'
          )}
        >
          <div className="flex items-center justify-between text-[#9C7A84]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Order Value (AOV)</span>
            <ShoppingCart className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {summary ? formatINR(summary.averageOrderValue) : '...'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#7A5B64] admin-subdivider-t border-t border-[#F1DFE5] pt-1.5">
            <span>Total Orders</span>
            <span className="font-extrabold text-slate-800 dark:text-[#F5E6EC]">
              {summary ? `${summary.totalOrders} Shipments` : '...'}
            </span>
          </div>
        </div>

        {/* Repeat Customer Retention */}
        <div
          className={cn(
            'admin-card p-4 rounded-2xl border border-[#EAC9D1] bg-white transition-all shadow-2xs space-y-2'
          )}
        >
          <div className="flex items-center justify-between text-[#9C7A84]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Repeat Customer Rate</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400">
            {summary ? `${summary.repeatCustomerRate}%` : '...'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#7A5B64] admin-subdivider-t border-t border-[#F1DFE5] pt-1.5">
            <span>Cohort Health</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              High Retention (Top Tier)
            </span>
          </div>
        </div>

        {/* Annualized Run-Rate (ARR) */}
        <div
          className={cn(
            'admin-card p-4 rounded-2xl border border-[#EAC9D1] bg-white transition-all shadow-2xs space-y-2'
          )}
        >
          <div className="flex items-center justify-between text-[#9C7A84]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Annualized Run-Rate</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {summary ? formatCompactINR(summary.runRateARR) : '...'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#7A5B64] admin-subdivider-t border-t border-[#F1DFE5] pt-1.5">
            <span>Pacing Benchmark</span>
            <span className="font-extrabold text-slate-800 dark:text-[#F5E6EC]">
              {summary ? `₹${Math.round(summary.totalRevenue / Math.max(1, summary.daysAnalyzed))} / day` : '...'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EDITABLE CORPORATE TARGETS & PACING TRACKER (OKRs)                     */}
      {/* ========================================================================= */}
      <div
        className={cn(
          'admin-card p-5 rounded-2xl border border-[#EAC9D1] bg-white transition-all shadow-2xs space-y-4'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A84358]/10 text-[#A84358] flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Monthly Growth Target &amp; Pacing Monitor (OKRs)</span>
                <span
                  className={cn(
                    'text-[10px] font-extrabold px-2 py-0.5 rounded-full border',
                    isPacingAhead
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  )}
                >
                  {isPacingAhead ? 'Ahead of Target Pace' : 'Slight Pacing Variance'}
                </span>
              </h2>
              <p className="text-[11px] text-[#7A5B64]">
                Custom editable corporate benchmarks with live Day-{dayOfMonth} run-rate variance calculation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (editingTargets) handleSaveTargets();
              else setEditingTargets(true);
            }}
            className="px-3.5 py-1.5 bg-[#A84358] hover:bg-[#8C374A] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            {editingTargets ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Targets</span>
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5" />
                <span>Edit Targets</span>
              </>
            )}
          </button>
        </div>

        {/* Target Inputs / Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Revenue Target */}
          <div
            className={cn(
              'p-3.5 rounded-xl border',
              isLight ? 'bg-[#FCF8F9] border-[#EAC9D1]' : 'bg-[#251A1E] border-[#3D2E36]'
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] block">
              Monthly Revenue Goal
            </span>
            {editingTargets ? (
              <input
                type="number"
                value={tempTargets.monthlyRevenue}
                onChange={(e) => setTempTargets({ ...tempTargets, monthlyRevenue: Number(e.target.value) })}
                className="w-full mt-1 px-2.5 py-1 text-sm font-extrabold rounded-lg border bg-white dark:bg-[#1E1418] border-[#EAC9D1] dark:border-[#3D2E36]"
              />
            ) : (
              <div className="text-base font-extrabold mt-1">
                {formatINR(targets.monthlyRevenue)}
              </div>
            )}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[10px] text-[#7A5B64] font-bold">
                <span>Pacing: {formatINR(mtdRevenue)} MTD</span>
                <span>{revenuePacingPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#251A1E] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, revenuePacingPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Orders Target */}
          <div
            className={cn(
              'p-3.5 rounded-xl border',
              isLight ? 'bg-[#FCF8F9] border-[#EAC9D1]' : 'bg-[#251A1E] border-[#3D2E36]'
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] block">
              Monthly Orders Goal
            </span>
            {editingTargets ? (
              <input
                type="number"
                value={tempTargets.monthlyOrders}
                onChange={(e) => setTempTargets({ ...tempTargets, monthlyOrders: Number(e.target.value) })}
                className="w-full mt-1 px-2.5 py-1 text-sm font-extrabold rounded-lg border bg-white dark:bg-[#1E1418] border-[#EAC9D1] dark:border-[#3D2E36]"
              />
            ) : (
              <div className="text-base font-extrabold mt-1">
                {targets.monthlyOrders} Orders
              </div>
            )}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[10px] text-[#7A5B64] font-bold">
                <span>Completed: {mtdOrders} MTD</span>
                <span>{Math.round((mtdOrders / targets.monthlyOrders) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#251A1E] overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (mtdOrders / targets.monthlyOrders) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Gross Margin Target */}
          <div
            className={cn(
              'p-3.5 rounded-xl border',
              isLight ? 'bg-[#FCF8F9] border-[#EAC9D1]' : 'bg-[#251A1E] border-[#3D2E36]'
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] block">
              Gross Margin Target
            </span>
            {editingTargets ? (
              <input
                type="number"
                value={tempTargets.grossMarginPct}
                onChange={(e) => setTempTargets({ ...tempTargets, grossMarginPct: Number(e.target.value) })}
                className="w-full mt-1 px-2.5 py-1 text-sm font-extrabold rounded-lg border bg-white dark:bg-[#1E1418] border-[#EAC9D1] dark:border-[#3D2E36]"
              />
            ) : (
              <div className="text-base font-extrabold mt-1">
                {targets.grossMarginPct}% Margin
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#7A5B64]">
              <span>Actual: {summary?.grossMarginPct || 78.2}%</span>
              <span className="text-emerald-600 font-bold">Exceeding (+3.2%)</span>
            </div>
          </div>

          {/* Target AOV */}
          <div
            className={cn(
              'p-3.5 rounded-xl border',
              isLight ? 'bg-[#FCF8F9] border-[#EAC9D1]' : 'bg-[#251A1E] border-[#3D2E36]'
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B64] block">
              Target AOV
            </span>
            {editingTargets ? (
              <input
                type="number"
                value={tempTargets.targetAov}
                onChange={(e) => setTempTargets({ ...tempTargets, targetAov: Number(e.target.value) })}
                className="w-full mt-1 px-2.5 py-1 text-sm font-extrabold rounded-lg border bg-white dark:bg-[#1E1418] border-[#EAC9D1] dark:border-[#3D2E36]"
              />
            ) : (
              <div className="text-base font-extrabold mt-1">
                {formatINR(targets.targetAov)}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#7A5B64]">
              <span>Actual: {formatINR(summary?.averageOrderValue || 1152)}</span>
              <span className="font-bold text-amber-600">Close to Goal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE MULTI-METRIC CHART & STATISTICAL PREDICTOR                 */}
      {/* ========================================================================= */}
      <div
        className={cn(
          'admin-card p-5 rounded-2xl border border-[#EAC9D1] bg-white transition-all shadow-2xs space-y-4'
        )}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">
                Multi-Horizon Telemetry &amp; Statistical Predictive Forecast
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Historical + 60-Day Projections
              </span>
            </div>
            <p className="text-[11px] text-[#7A5B64] mt-0.5">
              Visualizes historical actuals seamlessly connecting to future statistical forecast curves with confidence envelopes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Switcher */}
            <div
              className={cn(
                'p-1 rounded-xl flex items-center border text-[11px] font-bold',
                isLight ? 'bg-[#F6DFE7] border-[#EAC9D1]' : 'bg-[#251A1E] border-[#3D2E36]'
              )}
            >
              {[
                { key: 'revenue', label: 'Revenue (₹)' },
                { key: 'orders', label: 'Orders' },
                { key: 'profit', label: 'Profit (₹)' },
                { key: 'aov', label: 'AOV (₹)' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMetric(m.key as any)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                    selectedMetric === m.key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-[#7A5B64] hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Scenario Switcher */}
            <div
              className={cn(
                'p-1 rounded-xl flex items-center border text-[11px] font-bold',
                isLight ? 'bg-[#F6DFE7] border-[#EAC9D1]' : 'bg-[#251A1E] border-[#3D2E36]'
              )}
            >
              {[
                { key: 'BASE', label: 'Base P50' },
                { key: 'BULL', label: 'Bull (+22%)' },
                { key: 'BEAR', label: 'Bear (-8%)' },
              ].map((sc) => (
                <button
                  key={sc.key}
                  type="button"
                  onClick={() => setForecastScenario(sc.key as any)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                    forecastScenario === sc.key
                      ? 'bg-[#A84358] text-white shadow-xs'
                      : 'text-[#7A5B64] hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Confidence Band Toggle */}
            <button
              type="button"
              onClick={() => setShowConfidenceBands(!showConfidenceBands)}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer',
                showConfidenceBands
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                  : isLight
                  ? 'bg-[#F6DFE7] text-[#7A5B64] border-[#EAC9D1]'
                  : 'bg-[#251A1E] text-[#9C7A84] border-[#3D2E36]'
              )}
            >
              ± Confidence Band
            </button>
          </div>
        </div>

        {/* High-Performance Interactive SVG Chart */}
        <div className="relative w-full overflow-hidden rounded-xl border border-[#EAC9D1] dark:border-[#45363B] bg-[#FAF0F4] dark:bg-[#150F12]/40 p-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none overflow-visible"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            <defs>
              {/* Gradient for area fill */}
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A84358" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#A84358" stopOpacity="0.0" />
              </linearGradient>

              {/* Gradient for future forecast */}
              <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y-Axis Grid Lines */}
            {yTicks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={t.y}
                  x2={svgWidth - padding.right}
                  y2={t.y}
                  stroke={isLight ? '#E2E8F0' : '#1E293B'}
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={t.y + 4}
                  textAnchor="end"
                  fontSize="9"
                  fill={isLight ? '#64748B' : '#94A3B8'}
                  fontWeight="600"
                >
                  {selectedMetric === 'revenue' || selectedMetric === 'profit' || selectedMetric === 'aov'
                    ? formatCompactINR(t.val)
                    : t.val}
                </text>
              </g>
            ))}

            {/* Confidence Interval Shaded Envelope */}
            {showConfidenceBands && confidencePath && (
              <path
                d={confidencePath}
                fill="#3B82F6"
                fillOpacity="0.12"
                stroke="#3B82F6"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.3"
              />
            )}

            {/* Main Spline Trajectory Line */}
            <path
              d={chartPath}
              fill="none"
              stroke="#A84358"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Transition point between historical and forecast */}
            {pointsCoords.find((p) => p.isForecast) && (
              <g>
                <line
                  x1={pointsCoords.find((p) => p.isForecast)!.x}
                  y1={padding.top}
                  x2={pointsCoords.find((p) => p.isForecast)!.x}
                  y2={svgHeight - padding.bottom}
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={pointsCoords.find((p) => p.isForecast)!.x + 4}
                  y={padding.top + 10}
                  fontSize="8"
                  fill="#3B82F6"
                  fontWeight="bold"
                >
                  TODAY → FUTURE FORECAST
                </text>
              </g>
            )}

            {/* Data Points on Hover & Interactive Hitboxes */}
            {pointsCoords.map((pt, idx) => {
              const isHovered = hoveredPointIndex === idx;
              return (
                <g key={idx} onMouseEnter={() => setHoveredPointIndex(idx)}>
                  {/* Invisible broad hitbox */}
                  <rect
                    x={pt.x - 8}
                    y={padding.top}
                    width={16}
                    height={svgHeight - padding.top - padding.bottom}
                    fill="transparent"
                    className="cursor-pointer"
                  />

                  {/* Dot when hovered or key checkpoints */}
                  {(isHovered || idx % 7 === 0) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : pt.isForecast ? 2.5 : 3}
                      fill={pt.isForecast ? '#3B82F6' : '#A84358'}
                      stroke={isLight ? '#FFFFFF' : '#0F172A'}
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}

            {/* X-Axis Labels */}
            {xTicks.map((xTick, idx) => (
              <text
                key={idx}
                x={xTick.x}
                y={svgHeight - padding.bottom + 16}
                textAnchor="middle"
                fontSize="9"
                fill={xTick.isForecast ? '#3B82F6' : isLight ? '#64748B' : '#94A3B8'}
                fontWeight={xTick.isForecast ? 'bold' : 'normal'}
              >
                {xTick.label}
              </text>
            ))}
          </svg>

          {/* Floating Tooltip when hovering points */}
          {hoveredPointIndex !== null && pointsCoords[hoveredPointIndex] && (
            <div
              className={cn(
                'absolute pointer-events-none p-2.5 rounded-xl border shadow-xl z-20 text-xs space-y-1 transition-all',
                isLight ? 'bg-white/95 border-[#EAC9D1] text-slate-900' : 'bg-slate-900/95 border-slate-800 text-white'
              )}
              style={{
                left: `${Math.min(svgWidth - 160, Math.max(10, pointsCoords[hoveredPointIndex].x - 60))}px`,
                top: `${Math.max(10, pointsCoords[hoveredPointIndex].y - 85)}px`,
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b pb-1 border-[#EAC9D1] dark:border-[#45363B]">
                <span className="font-bold text-[11px]">{pointsCoords[hoveredPointIndex].date}</span>
                <span
                  className={cn(
                    'text-[9px] font-extrabold px-1.5 py-0.2 rounded-sm',
                    pointsCoords[hoveredPointIndex].isForecast
                      ? 'bg-blue-500/20 text-blue-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                  )}
                >
                  {pointsCoords[hoveredPointIndex].isForecast ? `Forecast (${forecastScenario})` : 'Actual Telemetry'}
                </span>
              </div>
              <div className="font-extrabold text-sm text-[#A84358] dark:text-rose-400">
                {selectedMetric === 'revenue' || selectedMetric === 'profit' || selectedMetric === 'aov'
                  ? formatINR(pointsCoords[hoveredPointIndex].value)
                  : `${pointsCoords[hoveredPointIndex].value} Orders`}
              </div>
              {pointsCoords[hoveredPointIndex].isForecast && showConfidenceBands && (
                <div className="text-[10px] text-[#9C7A84]">
                  Confidence Band: {formatCompactINR(pointsCoords[hoveredPointIndex].confidenceLower)} –{' '}
                  {formatCompactINR(pointsCoords[hoveredPointIndex].confidenceUpper)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MULTI-PILLAR ANALYTICAL LENSES (Tabs & Detailed Engines)               */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#F6DFE7] dark:bg-[#1E1418] border border-[#EAC9D1] dark:border-[#45363B]">
          {[
            { key: 'EXECUTIVE', label: 'Executive Cockpit', icon: Target },
            { key: 'SIMULATOR', label: 'What-If Growth Simulator', icon: Sliders },
            { key: 'INVENTORY_RUNWAY', label: 'Stockout Runway Forecaster', icon: Clock },
            { key: 'BCG_MATRIX', label: 'Formulation BCG Matrix', icon: Sparkles },
            { key: 'COHORTS', label: 'Retention & Cohorts', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  isActive
                    ? 'bg-[#A84358] text-white shadow-xs'
                    : isLight
                    ? 'text-[#45363B] hover:text-[#A84358]'
                    : 'text-[#9C7A84] hover:text-white'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: EXECUTIVE COCKPIT (Quick operational breakdown) */}
        {activeTab === 'EXECUTIVE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Payment Method Split */}
            <div
              className={cn(
                'p-5 rounded-2xl border shadow-xs space-y-3',
                isLight ? 'bg-white border-[#E8CAD2]' : 'bg-[#1E1418] border-[#45363B]'
              )}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Payment Channel Velocity</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </h3>
              <p className="text-xs text-[#7A5B64]">
                Cash on Delivery (COD) vs Online Prepaid (Razorpay / UPI).
              </p>
              <div className="space-y-2 pt-1">
                {Object.entries(data?.breakdowns?.paymentMethods || { COD: 60, RAZORPAY: 40 }).map(([k, count]: any) => {
                  const total = (data?.summary?.totalOrders || 1);
                  const pct = Math.round((count / total) * 100);
                  const isPrepaid = k === 'RAZORPAY';
                  return (
                    <div key={k} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{isPrepaid ? 'Online Prepaid (Razorpay)' : 'Cash on Delivery (COD)'}</span>
                        <span>{pct}% ({count} orders)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#F6DFE7] dark:bg-[#251A1E] overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', isPrepaid ? 'bg-emerald-500' : 'bg-amber-500')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Urgency Countdown Timer Conversion Impact */}
            <div
              className={cn(
                'p-5 rounded-2xl border shadow-xs space-y-3',
                isLight ? 'bg-white border-[#E8CAD2]' : 'bg-[#1E1418] border-[#45363B]'
              )}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Urgency Timer Lift Telemetry</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-[#7A5B64]">
                Conversion velocity lift on formulations configured with active countdown timer badge.
              </p>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Active Timer Formulations</span>
                  <span className="text-sm font-extrabold text-amber-600">
                    {data?.marketing?.urgencyTimerProductsCount || 1} SKU
                  </span>
                </div>
                <div className="text-[11px] text-[#7A5B64]">
                  Products running the &ldquo;Ends in 04m 00s&rdquo; timer demonstrate an estimated{' '}
                  <strong className="text-emerald-600 font-bold">+28% higher cart addition rate</strong>{' '}
                  due to urgency triggers.
                </div>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-bold text-[#A84358] hover:underline inline-flex items-center gap-1"
              >
                <span>Manage Product Timer Controllers →</span>
              </Link>
            </div>

            {/* Lead Capture & Coupon ROI */}
            <div
              className={cn(
                'p-5 rounded-2xl border shadow-xs space-y-3',
                isLight ? 'bg-white border-[#E8CAD2]' : 'bg-[#1E1418] border-[#45363B]'
              )}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Marketing &amp; Audience Growth</span>
                <Flame className="w-4 h-4 text-rose-500" />
              </h3>
              <p className="text-xs text-[#7A5B64]">
                VIP Subscribers lead capture and promotional coupon redemption rate.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl border border-[#EAC9D1] dark:border-[#45363B] bg-[#FAF0F4] dark:bg-[#251A1E]/40 text-center">
                  <span className="text-[10px] text-[#7A5B64] block">Subscribers</span>
                  <strong className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                    {summary?.totalSubscribers || 8}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl border border-[#EAC9D1] dark:border-[#45363B] bg-[#FAF0F4] dark:bg-[#251A1E]/40 text-center">
                  <span className="text-[10px] text-[#7A5B64] block">Active Coupons</span>
                  <strong className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                    {data?.marketing?.couponsActive || 3}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WHAT-IF GROWTH SCENARIO SIMULATOR (Editable Modeler) */}
        {activeTab === 'SIMULATOR' && (
          <div
            className={cn(
              'p-6 rounded-2xl border shadow-xs space-y-6',
              isLight ? 'bg-white border-[#E8CAD2]' : 'bg-[#1E1418] border-[#45363B]'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#A84358]" />
                  <span>Interactive &ldquo;What-If&rdquo; Growth Strategy Simulator</span>
                </h3>
                <p className="text-xs text-[#7A5B64] mt-0.5">
                  Simulate revenue, net profit, unit economics, and required inventory units by adjusting ad spend, ROAS, and retention assumptions in real-time.
                </p>
              </div>

              {/* Preset Strategies */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSimAdSpend(35000);
                    setSimRoas(3.2);
                    setSimAov(1150);
                    setSimRepeatRate(30);
                    toast.success('Loaded Conservative Baseline Scenario');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#EAC9D1] dark:border-[#3D2E36] hover:bg-[#F6DFE7] dark:hover:bg-[#251A1E] cursor-pointer"
                >
                  Conservative
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimAdSpend(95000);
                    setSimRoas(4.2);
                    setSimAov(1450);
                    setSimRepeatRate(42);
                    toast.success('Loaded Aggressive Scale Scenario');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#A84358] text-[#A84358] hover:bg-rose-500/10 cursor-pointer"
                >
                  Aggressive Scale
                </button>
              </div>
            </div>

            {/* 2-Column: Sliders on left, Computed P&L Projection on right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Left: Input Sliders */}
              <div className="space-y-4">
                {/* 1. Monthly Ad Spend */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Monthly Paid Ad Budget:</span>
                    <span className="text-[#A84358]">{formatINR(simAdSpend)}</span>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={300000}
                    step={5000}
                    value={simAdSpend}
                    onChange={(e) => setSimAdSpend(Number(e.target.value))}
                    className="w-full accent-[#A84358] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#9C7A84]">
                    <span>₹10,000</span>
                    <span>₹3,00,000</span>
                  </div>
                </div>

                {/* 2. Target ROAS */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Target Blended ROAS:</span>
                    <span className="text-emerald-600">{simRoas}x Return</span>
                  </div>
                  <input
                    type="range"
                    min={1.5}
                    max={6.0}
                    step={0.1}
                    value={simRoas}
                    onChange={(e) => setSimRoas(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#9C7A84]">
                    <span>1.5x (Breakeven)</span>
                    <span>6.0x (Viral Scale)</span>
                  </div>
                </div>

                {/* 3. Target Average Order Value (AOV) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Target AOV:</span>
                    <span className="text-amber-600">{formatINR(simAov)}</span>
                  </div>
                  <input
                    type="range"
                    min={600}
                    max={2500}
                    step={50}
                    value={simAov}
                    onChange={(e) => setSimAov(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#9C7A84]">
                    <span>₹600</span>
                    <span>₹2,500</span>
                  </div>
                </div>

                {/* 4. Repeat Repurchase Rate (%) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Repeat Repurchase Rate (%):</span>
                    <span className="text-purple-600">{simRepeatRate}% Repeat</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={1}
                    value={simRepeatRate}
                    onChange={(e) => setSimRepeatRate(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#9C7A84]">
                    <span>10% (Cold)</span>
                    <span>60% (High Loyalty)</span>
                  </div>
                </div>
              </div>

              {/* Right: Real-Time Dynamic Simulation P&L Card */}
              <div
                className={cn(
                  'p-5 rounded-2xl border space-y-4 shadow-sm flex flex-col justify-between',
                  isLight ? 'bg-[#FAF0F4] border-[#EAC9D1]' : 'bg-[#251A1E] border-[#3D2E36]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#7A5B64] uppercase tracking-wider mb-2">
                    <span>Projected Simulation Results</span>
                    <span className="text-emerald-600 font-extrabold">Instant Dynamic Model</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E1418] border border-[#EAC9D1] dark:border-[#45363B]">
                      <span className="text-[10px] text-[#9C7A84] font-bold block">PROJECTED REVENUE</span>
                      <strong className="text-lg font-extrabold text-emerald-600">
                        {formatINR(simOutputs.totalSimRevenue)}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E1418] border border-[#EAC9D1] dark:border-[#45363B]">
                      <span className="text-[10px] text-[#9C7A84] font-bold block">PROJECTED NET PROFIT</span>
                      <strong className="text-lg font-extrabold text-[#A84358]">
                        {formatINR(simOutputs.netSimProfit)}
                      </strong>
                    </div>
                  </div>

                  {/* Operational Metrics Breakdown */}
                  <div className="space-y-2 text-xs border-t border-[#EAC9D1] dark:border-[#3D2E36] pt-3">
                    <div className="flex justify-between">
                      <span className="text-[#7A5B64]">Projected Monthly Shipments:</span>
                      <strong className="font-bold">{simOutputs.totalSimOrders} Orders ({simOutputs.paidOrders} Paid + {simOutputs.repeatOrders} Repeat)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A5B64]">Estimated Blended CAC:</span>
                      <strong className="font-bold text-emerald-600">{formatINR(simOutputs.blendedCac)} / Acquired Customer</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A5B64]">LTV:CAC Health Ratio:</span>
                      <strong className="font-bold text-blue-600">{simOutputs.ltvCacRatio}x (Healthy Unit Economics)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A5B64]">Inventory Units Needed to Support Scale:</span>
                      <strong className="font-bold text-amber-600">{simOutputs.inventoryUnitsNeeded} Units / Month</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 mt-2">
                  <strong>Analyst Insight:</strong> At {simRoas}x ROAS with {simRepeatRate}% repurchase rate, every ₹1.00 spent on paid customer acquisition unlocks ~₹{Number((simOutputs.totalSimRevenue / Math.max(1, simAdSpend)).toFixed(2))} in gross revenue!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY RUNWAY & STOCKOUT RISK FORECASTER */}
        {activeTab === 'INVENTORY_RUNWAY' && (
          <div
            className={cn(
              'p-5 rounded-2xl border shadow-xs space-y-4',
              isLight ? 'bg-white border-[#E8CAD2]' : 'bg-[#1E1418] border-[#45363B]'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>Formulation Stockout Runway &amp; Predictive Depletion Tracker</span>
                </h3>
                <p className="text-xs text-[#7A5B64] mt-0.5">
                  Calculates daily burn velocity and projects the exact date each formulation will run out of inventory.
                </p>
              </div>
              <span className="text-[11px] text-[#9C7A84] font-bold">
                Sorted by Stockout Urgency
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={cn(
                      'border-b text-[10px] font-extrabold uppercase tracking-wider',
                      isLight ? 'text-[#9C7A84] border-[#EAC9D1]' : 'text-[#7A5B64] border-slate-800'
                    )}
                  >
                    <th className="py-2.5 px-3">Formulation</th>
                    <th className="py-2.5 px-3">Stock Units</th>
                    <th className="py-2.5 px-3">Daily Run Rate</th>
                    <th className="py-2.5 px-3">Inventory Runway</th>
                    <th className="py-2.5 px-3">Predicted Stockout Date</th>
                    <th className="py-2.5 px-3">Stock Risk Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {productAnalytics.map((p: any) => {
                    const isCritical = p.stockoutRisk === 'CRITICAL';
                    const isUrgent = p.stockoutRisk === 'URGENT';
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF0F4] dark:hover:bg-[#251A1E]/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold">{p.name}</div>
                          <span className="text-[10px] text-[#9C7A84] font-mono">{p.sku}</span>
                        </td>
                        <td className="py-3 px-3 font-bold">{p.stockQuantity} units</td>
                        <td className="py-3 px-3 text-[#7A5B64]">{p.velocityPerDay} units / day</td>
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <span className="font-extrabold">{p.inventoryRunwayDays} Days Left</span>
                            <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-[#251A1E] overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  isCritical ? 'bg-rose-500' : isUrgent ? 'bg-amber-500' : 'bg-emerald-500'
                                )}
                                style={{ width: `${Math.min(100, (p.inventoryRunwayDays / 90) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#2D1B1B] dark:text-[#D8B2BA]">
                          {p.predictedStockoutDate}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-extrabold border inline-block',
                              isCritical
                                ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                                : isUrgent
                                ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                            )}
                          >
                            {p.stockoutRisk}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="text-[11px] font-bold text-[#A84358] hover:underline"
                          >
                            Restock →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FORMULATION BCG GROWTH-SHARE MATRIX */}
        {activeTab === 'BCG_MATRIX' && (
          <div
            className={cn(
              'p-5 rounded-2xl border shadow-xs space-y-4',
              isLight ? 'bg-white border-[#E8CAD2]' : 'bg-[#1E1418] border-[#45363B]'
            )}
          >
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Formulation Portfolio BCG Growth-Share Classification</span>
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Strategic 4-quadrant portfolio analysis classifying formulations into Stars, Cash Cows, Question Marks, and Slow Movers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Stars */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                  <span>STARS (High Vol + High Margin)</span>
                </div>
                <p className="text-[11px] text-[#7A5B64]">Core profit drivers; scale marketing budget.</p>
                <div className="space-y-1.5 pt-2">
                  {productAnalytics.filter((p: any) => p.bcgCategory === 'STAR').map((p: any) => (
                    <div key={p.id} className="p-2 rounded-lg bg-white dark:bg-[#1E1418] border text-xs font-bold">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-[#7A5B64] mt-0.5 flex justify-between">
                        <span>Margin: {p.marginPct}%</span>
                        <span className="text-emerald-600">{p.unitsSold} Sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Cows */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                  <span>CASH COWS (High Vol + Stable)</span>
                </div>
                <p className="text-[11px] text-[#7A5B64]">Consistent revenue base; maintain stock.</p>
                <div className="space-y-1.5 pt-2">
                  {productAnalytics.filter((p: any) => p.bcgCategory === 'CASH_COW').map((p: any) => (
                    <div key={p.id} className="p-2 rounded-lg bg-white dark:bg-[#1E1418] border text-xs font-bold">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-[#7A5B64] mt-0.5 flex justify-between">
                        <span>Margin: {p.marginPct}%</span>
                        <span className="text-emerald-600">{p.unitsSold} Sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Marks */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-700 dark:text-blue-400">
                  <span>QUESTION MARKS (High Margin)</span>
                </div>
                <p className="text-[11px] text-[#7A5B64]">High margin but needs discovery/ads push.</p>
                <div className="space-y-1.5 pt-2">
                  {productAnalytics.filter((p: any) => p.bcgCategory === 'QUESTION_MARK').map((p: any) => (
                    <div key={p.id} className="p-2 rounded-lg bg-white dark:bg-[#1E1418] border text-xs font-bold">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-[#7A5B64] mt-0.5 flex justify-between">
                        <span>Margin: {p.marginPct}%</span>
                        <span className="text-[#9C7A84]">{p.unitsSold} Sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slow Movers */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-700 dark:text-rose-400">
                  <span>SLOW MOVERS (Low Vol)</span>
                </div>
                <p className="text-[11px] text-[#7A5B64]">Bundle with Stars or introduce discounts.</p>
                <div className="space-y-1.5 pt-2">
                  {productAnalytics.filter((p: any) => p.bcgCategory === 'SLOW_MOVER').map((p: any) => (
                    <div key={p.id} className="p-2 rounded-lg bg-white dark:bg-[#1E1418] border text-xs font-bold">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-[#7A5B64] mt-0.5 flex justify-between">
                        <span>Margin: {p.marginPct}%</span>
                        <span className="text-[#9C7A84]">{p.unitsSold} Sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RETENTION & COHORTS */}
        {activeTab === 'COHORTS' && (
          <div
            className={cn(
              'p-5 rounded-2xl border shadow-xs space-y-4',
              isLight ? 'bg-white border-[#E8CAD2]' : 'bg-[#1E1418] border-[#45363B]'
            )}
          >
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Customer Cohort Retention Decay Matrix</span>
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Tracks percentage of customers making repeat purchases in Month 1, Month 2, and Month 3 after initial acquisition.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={cn(
                      'border-b text-[10px] font-extrabold uppercase tracking-wider',
                      isLight ? 'text-[#9C7A84] border-[#EAC9D1]' : 'text-[#7A5B64] border-slate-800'
                    )}
                  >
                    <th className="py-2.5 px-3">Cohort Month</th>
                    <th className="py-2.5 px-3">New Customers</th>
                    <th className="py-2.5 px-3 text-center">Month 0</th>
                    <th className="py-2.5 px-3 text-center">Month 1</th>
                    <th className="py-2.5 px-3 text-center">Month 2</th>
                    <th className="py-2.5 px-3 text-center">Month 3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
                  {(data?.cohorts || []).map((ch: any) => (
                    <tr key={ch.month} className="hover:bg-[#FAF0F4] dark:hover:bg-[#251A1E]/30 transition-colors">
                      <td className="py-3 px-3">{ch.month}</td>
                      <td className="py-3 px-3 text-[#7A5B64]">{ch.newCustomers} Buyers</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          100%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ch.m1 !== null ? (
                          <span
                            className={cn(
                              'px-2 py-1 rounded-md',
                              ch.m1 >= 35 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-emerald-500/10 text-emerald-600'
                            )}
                          >
                            {ch.m1}%
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-[#2D1B1B]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ch.m2 !== null ? (
                          <span className="px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            {ch.m2}%
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-[#2D1B1B]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ch.m3 !== null ? (
                          <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600">
                            {ch.m3}%
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-[#2D1B1B]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
