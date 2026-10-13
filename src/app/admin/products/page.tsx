'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flame,
  Tag,
  Star,
  Eye,
  EyeOff,
  Percent,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  regularPrice: number;
  salePrice?: number | null;
  stockQuantity: number;
  active: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  hasTimer: boolean;
  category?: { name: string } | null;
  images: { url: string }[];
}

export default function AdminProductsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading, mutate } = useSWR<{ products: ProductItem[] }>(
    '/api/admin/products',
    fetcher
  );
  const products = data?.products ?? [];

  // Filtering tabs
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'BEST_SELLERS' | 'DEALS' | 'TIMER' | 'FEATURED' | 'LOW_STOCK' | 'DRAFTS'
  >('ALL');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick Deal Modal State
  const [dealModalProduct, setDealModalProduct] = useState<ProductItem | null>(null);
  const [dealSalePrice, setDealSalePrice] = useState<string>('');
  const [dealEnabled, setDealEnabled] = useState<boolean>(true);
  const [dealTimerEnabled, setDealTimerEnabled] = useState<boolean>(false);
  const [savingDeal, setSavingDeal] = useState(false);

  // Fast single-field update handler (for 1-click toggles)
  const handleFastUpdate = async (id: string, updates: Partial<ProductItem>, successMsg: string) => {
    // Optimistic update
    mutate(
      {
        products: products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      },
      false
    );

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error('Failed to update product');
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err.message || 'Error updating product');
      mutate(); // rollback
    }
  };

  const handleToggleBestSeller = async (p: ProductItem) => {
    const nextVal = !p.isBestSeller;
    await handleFastUpdate(
      p.id,
      { isBestSeller: nextVal },
      nextVal
        ? `🔥 "${p.name}" added to Home Best Sellers!`
        : `"${p.name}" removed from Best Sellers`
    );
  };

  const handleToggleFeatured = async (p: ProductItem) => {
    const nextVal = !p.isFeatured;
    await handleFastUpdate(
      p.id,
      { isFeatured: nextVal },
      nextVal ? `⭐ "${p.name}" marked as Featured` : `"${p.name}" removed from Featured`
    );
  };

  const handleToggleActive = async (p: ProductItem) => {
    const nextVal = !p.active;
    await handleFastUpdate(
      p.id,
      { active: nextVal },
      nextVal ? `"${p.name}" is now Live on Storefront` : `"${p.name}" hidden as Draft`
    );
  };

  const handleToggleTimer = async (p: ProductItem) => {
    const nextVal = !p.hasTimer;
    await handleFastUpdate(
      p.id,
      { hasTimer: nextVal },
      nextVal
        ? `⏱️ Urgency countdown timer activated on "${p.name}"!`
        : `⏱️ Urgency countdown timer removed from "${p.name}"`
    );
  };

  const handleStopTimer = async (p: ProductItem) => {
    await handleFastUpdate(
      p.id,
      { hasTimer: false },
      `⏱️ Urgency countdown timer stopped on "${p.name}"`
    );
  };

  // Open Quick Deal modal
  const openDealModal = (p: ProductItem) => {
    setDealModalProduct(p);
    setDealSalePrice(
      p.salePrice !== undefined && p.salePrice !== null ? String(p.salePrice) : ''
    );
    setDealEnabled(p.isOnSale ?? Boolean(p.salePrice && p.salePrice < p.regularPrice));
    setDealTimerEnabled(Boolean(p.hasTimer));
  };

  // Save Quick Deal
  const handleSaveDeal = async () => {
    if (!dealModalProduct) return;
    const saleNum = parseFloat(dealSalePrice);
    if (dealEnabled && (!saleNum || isNaN(saleNum) || saleNum >= dealModalProduct.regularPrice)) {
      toast.error(
        `Deal price must be greater than ₹0 and less than MRP (₹${dealModalProduct.regularPrice})`
      );
      return;
    }

    setSavingDeal(true);
    try {
      const updates = {
        salePrice: dealEnabled ? saleNum : null,
        isOnSale: dealEnabled,
        hasTimer: dealTimerEnabled,
      };

      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dealModalProduct.id, ...updates }),
      });
      if (!res.ok) throw new Error('Failed to save deal');

      mutate(
        {
          products: products.map((p) =>
            p.id === dealModalProduct.id ? { ...p, ...updates } : p
          ),
        },
        false
      );

      toast.success(
        dealEnabled
          ? `🏷️ Deal applied: ₹${saleNum} (${Math.round(
              ((dealModalProduct.regularPrice - saleNum) / dealModalProduct.regularPrice) * 100
            )}% OFF)!`
          : 'Promotional deal removed'
      );
      setDealModalProduct(null);
    } catch (err: any) {
      toast.error(err.message || 'Error updating deal');
    } finally {
      setSavingDeal(false);
    }
  };

  // Quick remove deal directly
  const handleRemoveDeal = async (p: ProductItem) => {
    await handleFastUpdate(
      p.id,
      { salePrice: null, isOnSale: false },
      `Promotional deal removed from "${p.name}"`
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      toast.success('Product removed successfully');
      mutate(
        { products: products.filter((p) => p.id !== deleteId) },
        false
      );
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting product');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeTab === 'BEST_SELLERS') return p.isBestSeller;
      if (activeTab === 'DEALS')
        return p.isOnSale || (p.salePrice && p.salePrice < p.regularPrice);
      if (activeTab === 'TIMER') return p.hasTimer;
      if (activeTab === 'FEATURED') return p.isFeatured;
      if (activeTab === 'LOW_STOCK') return p.stockQuantity <= 15;
      if (activeTab === 'DRAFTS') return !p.active;
      return true;
    });
  }, [products, activeTab]);

  // Metric counts
  const bestSellerCount = products.filter((p) => p.isBestSeller).length;
  const dealCount = products.filter(
    (p) => p.isOnSale || (p.salePrice && p.salePrice < p.regularPrice)
  ).length;
  const timerCount = products.filter((p) => p.hasTimer).length;
  const lowStockCount = products.filter((p) => p.stockQuantity <= 15).length;
  const draftCount = products.filter((p) => !p.active).length;

  const columns: Column<ProductItem>[] = [
    {
      header: 'Product Formulation',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border shadow-2xs',
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
            )}
          >
            <Image
              src={p.images?.[0]?.url || '/images/banners/banner-1.png'}
              alt={p.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div>
            <Link
              href={`/admin/products/${p.id}`}
              className={cn(
                'font-bold block hover:underline text-xs sm:text-sm max-w-xs sm:max-w-sm leading-snug',
                isLight ? 'text-slate-900' : 'text-white'
              )}
              title={p.name}
            >
              {p.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-500 font-mono">
                {p.sku || 'No SKU'}
              </span>
              {p.category?.name && (
                <span
                  className={cn(
                    'text-[9px] font-bold px-1.5 py-0.2 rounded border',
                    isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  )}
                >
                  {p.category.name}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Deals & Pricing',
      cell: (p) => {
        const hasDeal = p.isOnSale || (p.salePrice && p.salePrice < p.regularPrice);
        const discountPercent =
          hasDeal && p.salePrice
            ? Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100)
            : null;

        return (
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  'font-extrabold text-xs sm:text-sm',
                  hasDeal ? 'text-[#A84358]' : isLight ? 'text-slate-900' : 'text-white'
                )}
              >
                ₹{p.salePrice || p.regularPrice}
              </span>
              {hasDeal && (
                <span className="text-[10px] text-slate-400 line-through">
                  ₹{p.regularPrice}
                </span>
              )}
            </div>

            {hasDeal ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <Tag className="w-2.5 h-2.5" />
                  <span>{discountPercent}% OFF</span>
                </span>
                <button
                  type="button"
                  onClick={() => openDealModal(p)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openDealModal(p)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#A84358] hover:bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 transition-colors cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Put Deal</span>
              </button>
            )}
          </div>
        );
      },
    },
    {
      header: 'Home Best Seller',
      cell: (p) => (
        <button
          type="button"
          onClick={() => handleToggleBestSeller(p)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-2xs',
            p.isBestSeller
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              : isLight
              ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
          )}
          title={
            p.isBestSeller
              ? 'Click to remove from Home Best Sellers'
              : 'Click to feature in Home Best Sellers showcase'
          }
        >
          <Flame
            className={cn(
              'w-3.5 h-3.5',
              p.isBestSeller ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
            )}
          />
          <span>{p.isBestSeller ? 'Best Seller' : 'Make Best Seller'}</span>
        </button>
      ),
    },
    {
      header: 'Urgency Timer',
      cell: (p) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleToggleTimer(p)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-2xs',
              p.hasTimer
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                : isLight
                ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
            )}
            title={
              p.hasTimer
                ? 'Timer active: click to stop or remove countdown timer from this formulation'
                : 'Click to start urgency countdown timer on this formulation'
            }
          >
            <Clock
              className={cn(
                'w-3.5 h-3.5',
                p.hasTimer ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-400'
              )}
            />
            <span>{p.hasTimer ? 'Timer Active' : '+ Add Timer'}</span>
          </button>
          {p.hasTimer && (
            <button
              type="button"
              onClick={() => handleStopTimer(p)}
              className="px-2 py-1 rounded-xl text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 border border-rose-500/30 transition-all cursor-pointer shrink-0"
              title="Stop & remove urgency timer from this product"
            >
              ✕ Stop
            </button>
          )}
        </div>
      ),
    },
    {
      header: 'Featured',
      cell: (p) => (
        <button
          type="button"
          onClick={() => handleToggleFeatured(p)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer',
            p.isFeatured
              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
              : isLight
              ? 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
              : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
          )}
        >
          <Star
            className={cn(
              'w-3 h-3',
              p.isFeatured ? 'text-purple-500 fill-purple-500' : 'text-slate-400'
            )}
          />
          <span>{p.isFeatured ? 'Featured' : 'Feature'}</span>
        </button>
      ),
    },
    {
      header: 'Inventory',
      cell: (p) => (
        <span
          className={cn(
            'font-bold text-xs',
            p.stockQuantity <= 15
              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
              : isLight
              ? 'text-slate-700'
              : 'text-slate-300'
          )}
        >
          {p.stockQuantity} units
        </span>
      ),
    },
    {
      header: 'Store Status',
      cell: (p) => (
        <button
          type="button"
          onClick={() => handleToggleActive(p)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer',
            p.active
              ? isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
              : isLight
              ? 'bg-slate-100 text-slate-500 border-slate-200'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          )}
          title={p.active ? 'Click to hide from store (Draft)' : 'Click to make Live on store'}
        >
          {p.active ? (
            <CheckCircle className="w-3 h-3 text-emerald-600" />
          ) : (
            <EyeOff className="w-3 h-3 text-slate-400" />
          )}
          <span>{p.active ? 'Live' : 'Draft'}</span>
        </button>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right px-4 sm:px-6',
      className: 'text-right px-4 sm:px-6',
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openDealModal(p)}
            className={cn(
              'p-2 rounded-xl transition-colors cursor-pointer',
              isLight
                ? 'hover:bg-rose-50 text-slate-600 hover:text-[#A84358]'
                : 'hover:bg-slate-800 text-slate-400 hover:text-rose-400'
            )}
            title="Put Deal or Edit Pricing"
          >
            <Tag className="w-4 h-4" />
          </button>
          <Link
            href={`/admin/products/${p.id}`}
            className={cn(
              'p-2 rounded-xl transition-colors',
              isLight
                ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            )}
            title="Full Edit Formulation"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteId(p.id)}
            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Add Product Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={cn(
              'text-2xl font-bold font-serif',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            Product Catalog &amp; Deals Control
          </h1>
          <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
            Manage SKU variants, put promotional deals on products, set home best sellers, and toggle storefront availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/homepage"
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all inline-flex items-center gap-1.5',
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            )}
          >
            <span>Homepage CMS →</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-[#A84358] hover:bg-[#8C374A] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Formulation</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs',
            activeTab === 'ALL'
              ? 'border-[#A84358] ring-2 ring-[#A84358]/20'
              : '',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Formulations</span>
            <Package className="w-4 h-4 text-[#A84358]" />
          </div>
          <div
            className={cn(
              'text-xl sm:text-2xl font-extrabold',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            {products.length}
          </div>
          <span className="text-[10px] text-slate-500">In master store catalog</span>
        </div>

        {/* Best Sellers Card */}
        <div
          onClick={() => setActiveTab('BEST_SELLERS')}
          className={cn(
            'p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs',
            activeTab === 'BEST_SELLERS'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : '',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Home Best Sellers</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {bestSellerCount}
          </div>
          <span className="text-[10px] text-slate-500">Live on Home &ldquo;Best Sellers&rdquo;</span>
        </div>

        {/* Deals & Offers Card */}
        <div
          onClick={() => setActiveTab('DEALS')}
          className={cn(
            'p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs',
            activeTab === 'DEALS'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : '',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Deals</span>
            <Tag className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {dealCount}
          </div>
          <span className="text-[10px] text-slate-500">Discounted / Special Deals</span>
        </div>

        {/* Urgency Countdown Timer Card */}
        <div
          onClick={() => setActiveTab('TIMER')}
          className={cn(
            'p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs',
            activeTab === 'TIMER'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : '',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Urgency Timers</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {timerCount}
          </div>
          <span className="text-[10px] text-slate-500">&ldquo;Ends in 04m&rdquo; active</span>
        </div>

        {/* Low Stock Card */}
        <div
          onClick={() => setActiveTab('LOW_STOCK')}
          className={cn(
            'p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs',
            activeTab === 'LOW_STOCK'
              ? 'border-orange-500 ring-2 ring-orange-500/20'
              : '',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-orange-600 dark:text-orange-400">
            {lowStockCount}
          </div>
          <span className="text-[10px] text-slate-500">&le; 15 units remaining</span>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            activeTab === 'ALL'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          All Formulations ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('BEST_SELLERS')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
            activeTab === 'BEST_SELLERS'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
          )}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Home Best Sellers ({bestSellerCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('DEALS')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
            activeTab === 'DEALS'
              ? 'bg-[#A84358] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#A84358]'
          )}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Active Deals ({dealCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TIMER')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
            activeTab === 'TIMER'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>⏱️ With Timer ({timerCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('FEATURED')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
            activeTab === 'FEATURED'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
          )}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Featured ({products.filter((p) => p.isFeatured).length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('LOW_STOCK')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
            activeTab === 'LOW_STOCK'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-orange-600'
          )}
        >
          <span>Low Stock ({lowStockCount})</span>
        </button>
        {draftCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('DRAFTS')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'DRAFTS'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            Drafts ({draftCount})
          </button>
        )}
      </div>

      {/* Main Products Table */}
      <AdminDataTable
        data={filteredProducts}
        columns={columns}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        searchPlaceholder="Search product title, SKU, or category..."
        searchFilter={(p, q) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku ? p.sku.toLowerCase().includes(q) : false) ||
          (p.category?.name ? p.category.name.toLowerCase().includes(q) : false)
        }
        emptyMessage={
          activeTab === 'BEST_SELLERS'
            ? 'No products currently marked as Best Seller. Click "Make Best Seller" on any formulation to show it on the homepage!'
            : activeTab === 'DEALS'
            ? 'No products currently on special deal. Click "+ Put Deal" to apply discount pricing!'
            : activeTab === 'TIMER'
            ? 'No formulations currently have the urgency countdown timer running. Click "+ Add Timer" in the catalog to activate the countdown timer on any product!'
            : 'No formulations found in this catalog view.'
        }
      />

      {/* ========================================================================= */}
      {/* QUICK DEAL & OFFER MANAGER MODAL                                          */}
      {/* ========================================================================= */}
      {dealModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={cn(
              'rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border transition-colors',
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-white'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-[#A84358] flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">Put Deal on Product</h3>
                  <p className="text-[11px] text-slate-500">
                    Apply discount pricing and promotional badge to storefront
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDealModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Product Summary */}
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl border',
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
              )}
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                <Image
                  src={
                    dealModalProduct.images?.[0]?.url || '/images/banners/banner-1.png'
                  }
                  alt={dealModalProduct.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs truncate">{dealModalProduct.name}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Regular Price (MRP):{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-extrabold">
                    ₹{dealModalProduct.regularPrice}
                  </strong>
                </div>
              </div>
            </div>

            {/* Deal Enable Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div>
                <span className="text-xs font-bold text-[#A84358] block">
                  Activate Promotional Deal
                </span>
                <span className="text-[10px] text-slate-500">
                  Displays discounted price and deal badge on product card
                </span>
              </div>
              <input
                type="checkbox"
                checked={dealEnabled}
                onChange={(e) => setDealEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-[#A84358] accent-[#A84358] cursor-pointer"
              />
            </div>

            {dealEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Deal / Sale Price (₹)
                  </label>
                  <input
                    type="number"
                    value={dealSalePrice}
                    onChange={(e) => setDealSalePrice(e.target.value)}
                    placeholder="Enter discounted price, e.g. 699"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all focus:outline-hidden',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-white'
                    )}
                  />
                  {dealSalePrice &&
                    parseFloat(dealSalePrice) > 0 &&
                    parseFloat(dealSalePrice) < dealModalProduct.regularPrice && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span>
                          Customer saves ₹
                          {dealModalProduct.regularPrice - parseFloat(dealSalePrice)}!
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                          {Math.round(
                            ((dealModalProduct.regularPrice - parseFloat(dealSalePrice)) /
                              dealModalProduct.regularPrice) *
                              100
                          )}
                          % OFF Deal
                        </span>
                      </div>
                    )}
                </div>

                {/* Preset Discount Chips */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    ⚡ Quick Preset Discounts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[10, 15, 20, 25, 30, 40, 50].map((pct) => {
                      const computed = Math.round(
                        dealModalProduct.regularPrice * (1 - pct / 100)
                      );
                      const isSelected = parseFloat(dealSalePrice) === computed;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDealSalePrice(String(computed))}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                            isSelected
                              ? 'bg-[#A84358] text-white border-[#A84358]'
                              : isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          )}
                        >
                          {pct}% (₹{computed})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Urgency Countdown Timer Switch in Modal */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                    Show Urgency Countdown Timer (&ldquo;Ends in 04m 00s&rdquo;)
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Displays animated countdown badge on product card &amp; detail page
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={dealTimerEnabled}
                onChange={(e) => setDealTimerEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-amber-600 accent-amber-600 cursor-pointer ml-2 shrink-0"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {dealModalProduct.salePrice && (
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveDeal(dealModalProduct);
                    setDealModalProduct(null);
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-all cursor-pointer"
                >
                  Clear Deal
                </button>
              )}
              <button
                type="button"
                onClick={() => setDealModalProduct(null)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer',
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingDeal}
                onClick={handleSaveDeal}
                className="flex-1 py-2.5 bg-[#A84358] hover:bg-[#8C374A] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingDeal ? 'Saving...' : 'Apply Deal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={cn(
              'rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border text-center transition-colors',
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-white'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Delete Product?</h3>
              <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
                This action cannot be undone. All variants and orders referencing this item will remain recorded.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer',
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
