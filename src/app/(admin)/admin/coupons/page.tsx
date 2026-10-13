'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Ticket,
  Plus,
  Trash2,
  Tag,
  Percent,
  IndianRupee,
  Eye,
  EyeOff,
  Globe,
  Lock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { couponSchema } from '@/lib/schemas/coupon';
import { cn } from '@/lib/utils';

interface CouponItem {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  usedCount: number;
  active: boolean;
  isPublic: boolean;
  creatorName?: string | null;
}

export default function AdminCouponsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading, mutate } = useSWR<{ coupons: CouponItem[] }>(
    '/api/admin/coupons',
    fetcher
  );
  const coupons = data?.coupons ?? [];

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creatorName, setCreatorName] = useState('');
  const [creating, setCreating] = useState(false);

  // Filter tab state
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLIC' | 'HIDDEN'>('ALL');

  const filteredCoupons = coupons.filter((c) => {
    if (activeTab === 'PUBLIC') return c.isPublic;
    if (activeTab === 'HIDDEN') return !c.isPublic;
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod schema
    const parsed = couponSchema.safeParse({
      code: code.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrder || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      active: true,
      isPublic,
      creatorName: !isPublic && creatorName.trim() ? creatorName.trim() : null,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid coupon details');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create coupon');
      }

      toast.success(
        `Coupon ${parsed.data.code} created as ${
          isPublic ? 'Publicly visible' : 'Hidden creator promo'
        }!`
      );
      setCode('');
      setDiscountValue('');
      setMinOrder('0');
      setMaxDiscount('');
      setCreatorName('');
      setIsPublic(true);
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Error creating coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentIsPublic: boolean, codeName: string) => {
    const nextIsPublic = !currentIsPublic;
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublic: nextIsPublic }),
      });

      if (!res.ok) throw new Error('Failed to update visibility');

      toast.success(
        `Coupon ${codeName} is now ${nextIsPublic ? 'Visible on Website' : 'Hidden (Creator Promo)'}`
      );

      // Optimistically update
      mutate(
        {
          coupons: coupons.map((c) =>
            c.id === id ? { ...c, isPublic: nextIsPublic } : c
          ),
        },
        false
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update coupon visibility');
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${codeName}?`)) return;

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete coupon');
      toast.success(`Coupon ${codeName} deleted`);
      mutate(
        { coupons: coupons.filter((c) => c.id !== id) },
        false
      );
    } catch (err: any) {
      toast.error(err.message || 'Error deleting coupon');
    }
  };

  const publicCount = coupons.filter((c) => c.isPublic).length;
  const hiddenCount = coupons.filter((c) => !c.isPublic).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className={cn('text-2xl font-bold font-serif', isLight ? 'text-slate-900' : 'text-white')}>
          Coupons &amp; Creator Promotions
        </h1>
        <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
          Create site-wide discount codes or private hidden promo vouchers dedicated to specific content creators &amp; influencers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Create Form */}
        <div
          className={cn(
            'lg:col-span-5 p-6 rounded-3xl border shadow-sm space-y-5 transition-colors',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center gap-2 border-b pb-3">
            <Ticket className="w-4 h-4 text-rose-600" />
            <h3 className={cn('text-sm font-bold uppercase tracking-wider', isLight ? 'text-slate-900' : 'text-white')}>
              Create Promo Voucher
            </h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            {/* Visibility Option: Public vs Hidden */}
            <div className="space-y-1.5">
              <label className={cn('block font-bold mb-1', isLight ? 'text-slate-800' : 'text-slate-200')}>
                Storefront Visibility *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 cursor-pointer',
                    isPublic
                      ? isLight
                        ? 'bg-rose-50 border-rose-500 text-rose-950 ring-1 ring-rose-500'
                        : 'bg-rose-950/70 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                      : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Globe className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Public Storefront</span>
                  </div>
                  <span className="text-[10px] leading-tight opacity-80">
                    Visible on website &amp; offers page for all visitors.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 cursor-pointer',
                    !isPublic
                      ? isLight
                        ? 'bg-purple-50 border-purple-500 text-purple-950 ring-1 ring-purple-500'
                        : 'bg-purple-950/70 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                      : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Hidden (Creator Only)</span>
                  </div>
                  <span className="text-[10px] leading-tight opacity-80">
                    Hidden from website; active only when entered at checkout.
                  </span>
                </button>
              </div>
            </div>

            {/* Creator / Campaign Name (only shown when hidden) */}
            {!isPublic && (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 animate-in fade-in duration-200">
                <label className={cn('block font-bold mb-1 flex items-center gap-1.5 text-purple-700 dark:text-purple-300')}>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Content Creator / Campaign Handle *</span>
                </label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. @neha_ayurveda (Instagram) or YouTube Tech"
                  className={cn(
                    'w-full rounded-xl p-2.5 border transition-colors outline-hidden',
                    isLight
                      ? 'bg-white border-purple-300 text-slate-900 focus:border-purple-600'
                      : 'bg-slate-800 border-purple-500/40 text-white focus:border-purple-400'
                  )}
                />
                <p className="text-[10px] text-purple-600 dark:text-purple-300 mt-1">
                  Tag which influencer or creator this coupon is assigned to for tracking.
                </p>
              </div>
            )}

            <div>
              <label className={cn('block font-semibold mb-1', isLight ? 'text-slate-700' : 'text-slate-300')}>
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={isPublic ? 'e.g. HERBAL20' : 'e.g. NEHA20 or DIWALI_VIP'}
                className={cn(
                  'w-full rounded-xl p-3 font-mono font-bold uppercase border transition-colors outline-hidden',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-rose-600'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn('block font-semibold mb-1', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className={cn(
                    'w-full rounded-xl p-3 border transition-colors outline-hidden font-semibold',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                  )}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Flat Rupee (₹)</option>
                </select>
              </div>

              <div>
                <label className={cn('block font-semibold mb-1', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  Discount Value *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENTAGE' ? '20' : '150'}
                  className={cn(
                    'w-full rounded-xl p-3 border transition-colors outline-hidden font-bold text-rose-600 dark:text-rose-400',
                    isLight
                      ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 focus:border-rose-500'
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn('block font-semibold mb-1', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  Min Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="0"
                  className={cn(
                    'w-full rounded-xl p-3 border transition-colors outline-hidden',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                  )}
                />
              </div>

              <div>
                <label className={cn('block font-semibold mb-1', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  Max Cap (Optional ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder="250"
                  className={cn(
                    'w-full rounded-xl p-3 border transition-colors outline-hidden',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Creating Voucher...' : isPublic ? 'Create Public Coupon' : 'Create Creator Voucher'}</span>
            </button>
          </form>
        </div>

        {/* Coupons List */}
        <div
          className={cn(
            'lg:col-span-7 rounded-3xl border shadow-sm p-6 space-y-4 transition-colors',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          )}
        >
          {/* Header & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <h3 className={cn('text-sm font-bold uppercase tracking-wider', isLight ? 'text-slate-900' : 'text-white')}>
              Promo Codes ({filteredCoupons.length})
            </h3>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all',
                  activeTab === 'ALL'
                    ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold text-stone-900 dark:text-white'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                All ({coupons.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PUBLIC')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all flex items-center gap-1',
                  activeTab === 'PUBLIC'
                    ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold text-rose-700 dark:text-rose-400'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                <Globe className="w-3 h-3" />
                <span>Public ({publicCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('HIDDEN')}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all flex items-center gap-1',
                  activeTab === 'HIDDEN'
                    ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold text-purple-700 dark:text-purple-400'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                <Lock className="w-3 h-3" />
                <span>Creator / Hidden ({hiddenCount})</span>
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading coupons...</span>
            </div>
          )}

          {filteredCoupons.length === 0 && !isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold">No coupons found in this view.</p>
              <p className="text-[11px] opacity-75">
                {activeTab === 'HIDDEN'
                  ? 'Create a private coupon for an influencer or content creator on the left!'
                  : 'Generate a promo voucher code on the left!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCoupons.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    'p-4 rounded-2xl border flex items-center justify-between gap-4 transition-colors',
                    isLight
                      ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-50'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg border',
                          c.isPublic
                            ? isLight
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-rose-950 text-rose-400 border-rose-800'
                            : isLight
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-purple-950 text-purple-400 border-purple-800'
                        )}
                      >
                        {c.code}
                      </span>

                      <span className={cn('text-xs font-bold', isLight ? 'text-slate-900' : 'text-white')}>
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                      </span>

                      {/* Visibility Badge */}
                      {c.isPublic ? (
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950 px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-200 dark:border-rose-800">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Visible on Website</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Hidden (Creator Only)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 flex-wrap">
                      <span>Min: ₹{c.minOrderValue || 0}</span>
                      {c.maxDiscount ? <span>• Max Cap: ₹{c.maxDiscount}</span> : null}
                      <span>• Used {c.usedCount} times</span>
                      {c.creatorName && (
                        <span className="font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded">
                          Creator: {c.creatorName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle Visibility Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(c.id, c.isPublic, c.code)}
                      className={cn(
                        'p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold',
                        c.isPublic
                          ? 'text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                          : 'text-purple-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                      )}
                      title={
                        c.isPublic
                          ? 'Click to Hide from website (Make Creator-Only)'
                          : 'Click to Show on website & offers page'
                      }
                    >
                      {c.isPublic ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span className="hidden sm:inline text-[11px]">Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline text-[11px]">Show</span>
                        </>
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.code)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
