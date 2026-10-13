'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Boxes,
  AlertTriangle,
  Check,
  Plus,
  Minus,
  Package,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface ProductInventory {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  images: { url: string }[];
}

export default function AdminInventoryPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading, mutate } = useSWR<{ products: ProductInventory[] }>(
    '/api/admin/products',
    fetcher
  );
  const products = data?.products ?? [];

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStock = async (id: string, delta: number, currentQty: number) => {
    const newQty = Math.max(0, currentQty + delta);
    setUpdatingId(id);

    // Optimistic UI update via SWR
    mutate(
      {
        products: products.map((p) => (p.id === id ? { ...p, stockQuantity: newQty } : p)),
      },
      false
    );

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newQty }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
      toast.success(`Stock updated to ${newQty} units`);
    } catch (err: any) {
      toast.error(err.message || 'Error updating stock');
      mutate(); // Rollback
    } finally {
      setUpdatingId(null);
    }
  };

  // Inventory KPI statistics
  const stats = useMemo(() => {
    const totalUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const lowStockCount = products.filter(
      (p) => p.stockQuantity <= (p.lowStockThreshold || 10)
    ).length;
    const healthyCount = products.length - lowStockCount;
    return { totalUnits, lowStockCount, healthyCount, totalSkus: products.length };
  }, [products]);

  const columns: Column<ProductInventory>[] = [
    {
      header: 'Product',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (prod) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border',
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
            )}
          >
            <Image
              src={prod.images?.[0]?.url || '/images/banners/banner-1.png'}
              alt={prod.name}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <span
            title={prod.name}
            className={cn(
              'font-bold max-w-xs sm:max-w-md truncate block text-xs sm:text-[13px] leading-snug',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            {prod.name}
          </span>
        </div>
      ),
    },
    {
      header: 'SKU',
      cell: (prod) => (
        <span className={cn('font-mono text-[11px]', isLight ? 'text-slate-600' : 'text-slate-400')}>
          {prod.sku || '—'}
        </span>
      ),
    },
    {
      header: 'Current Stock',
      cell: (prod) => (
        <span className={cn('font-extrabold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
          {prod.stockQuantity}
        </span>
      ),
    },
    {
      header: 'Threshold',
      cell: (prod) => (
        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
          {prod.lowStockThreshold} units
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (prod) => {
        const isLow = prod.stockQuantity <= (prod.lowStockThreshold || 10);
        return isLow ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border text-[10px]',
              isLight ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-red-950 text-red-400 border-red-800'
            )}
          >
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-red-400" />
            <span>Low Stock</span>
          </span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border text-[10px]',
              isLight ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-rose-950 text-rose-400 border-rose-800'
            )}
          >
            <Check className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Healthy</span>
          </span>
        );
      },
    },
    {
      header: 'Quick Adjust',
      headerClassName: 'text-right px-4 sm:px-6',
      className: 'text-right px-4 sm:px-6',
      cell: (prod) => {
        const isBusy = updatingId === prod.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={isBusy || prod.stockQuantity <= 0}
              onClick={() => handleUpdateStock(prod.id, -1, prod.stockQuantity)}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center font-bold border transition-colors cursor-pointer disabled:opacity-40',
                isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              )}
              title="Decrease 1"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleUpdateStock(prod.id, 1, prod.stockQuantity)}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center font-bold border transition-colors cursor-pointer disabled:opacity-40',
                isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              )}
              title="Add 1"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleUpdateStock(prod.id, 10, prod.stockQuantity)}
              className={cn(
                'px-2 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border transition-colors cursor-pointer disabled:opacity-40',
                isLight ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800' : 'bg-rose-950 hover:bg-rose-900 border-rose-800 text-rose-300'
              )}
              title="Add 10"
            >
              +10
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className={cn('text-2xl font-bold font-serif', isLight ? 'text-slate-900' : 'text-white')}>
          Stock &amp; Inventory Management
        </h1>
        <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
          Monitor available inventory counts, low stock alerts, and make instant adjustments.
        </p>
      </div>

      <AdminDataTable
        data={products}
        columns={columns}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        searchPlaceholder="Search product or SKU..."
        searchFilter={(p, q) =>
          p.name.toLowerCase().includes(q) || (p.sku ? p.sku.toLowerCase().includes(q) : false)
        }
        topContent={
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-2">
            <div className={cn('p-4 rounded-2xl border transition-colors', isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900 border-slate-800 shadow-xs')}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total SKUs</span>
                <Boxes className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className={cn('text-xl font-extrabold', isLight ? 'text-slate-900' : 'text-white')}>{stats.totalSkus}</p>
            </div>

            <div className={cn('p-4 rounded-2xl border transition-colors', isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900 border-slate-800 shadow-xs')}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Units</span>
                <Package className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className={cn('text-xl font-extrabold', isLight ? 'text-slate-900' : 'text-white')}>{stats.totalUnits.toLocaleString()}</p>
            </div>

            <div className={cn('p-4 rounded-2xl border transition-colors', isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900 border-slate-800 shadow-xs')}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Healthy Stock</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{stats.healthyCount}</p>
            </div>

            <div className={cn('p-4 rounded-2xl border transition-colors', isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900 border-slate-800 shadow-xs')}>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className={cn('text-xl font-extrabold', stats.lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : isLight ? 'text-slate-900' : 'text-white')}>{stats.lowStockCount}</p>
            </div>
          </div>
        }
        emptyMessage="No inventory items found."
      />
    </div>
  );
}
