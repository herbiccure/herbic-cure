'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Star,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Home,
  AlertCircle,
  ArrowRight,
  Plus,
  X,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface ReviewItem {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  isApproved: boolean;
  isFeatured: boolean;
  product?: { name: string } | null;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading, mutate } = useSWR<{ reviews: ReviewItem[] }>(
    '/api/admin/reviews',
    fetcher
  );
  const reviews = data?.reviews ?? [];

  const { data: productsData } = useSWR<{ products: Array<{ id: string; name: string }> }>(
    '/api/admin/products',
    fetcher
  );
  const products = productsData?.products ?? [];

  const [activeTab, setActiveTab] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    productId: '',
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    content: '',
    isVerifiedPurchase: true,
    isApproved: true,
    isFeatured: false,
  });

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.productId) {
      toast.error('Please select a product');
      return;
    }
    if (!createForm.customerName.trim() || !createForm.content.trim()) {
      toast.error('Customer name and review content are required');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create review');
      }

      toast.success('Review added successfully!');
      setIsCreateOpen(false);
      setCreateForm({
        productId: '',
        customerName: '',
        customerEmail: '',
        rating: 5,
        title: '',
        content: '',
        isVerifiedPurchase: true,
        isApproved: true,
        isFeatured: false,
      });
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Error creating review');
    } finally {
      setCreateLoading(false);
    }
  };

  // Currently featured reviews on home page (max 6)
  const homeFeaturedReviews = reviews.filter((r) => r.isFeatured);
  const homeSelectedCount = homeFeaturedReviews.length;

  const handleToggle = async (
    id: string,
    field: 'isApproved' | 'isFeatured',
    currentVal: boolean
  ) => {
    // Check 6-review limit when featuring on Home Page
    if (field === 'isFeatured' && !currentVal) {
      if (homeSelectedCount >= 6) {
        toast.error(
          'Maximum 6 reviews can be shown on the Home Page. Please remove one from the showcase above first to select this review.',
          { duration: 4000 }
        );
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: !currentVal }),
      });
      if (!res.ok) throw new Error('Failed to update review status');

      if (field === 'isFeatured') {
        toast.success(
          !currentVal
            ? `Review added to Home Page showcase (${homeSelectedCount + 1}/6)`
            : `Review removed from Home Page showcase (${homeSelectedCount - 1}/6)`
        );
      } else {
        toast.success(
          !currentVal ? 'Review approved' : 'Review set to pending'
        );
      }

      mutate(
        {
          reviews: reviews.map((r) =>
            r.id === id ? { ...r, [field]: !currentVal } : r
          ),
        },
        false
      );
    } catch (err: any) {
      toast.error(err.message || 'Error updating review');
    }
  };

  const handleRemoveFromHome = async (id: string) => {
    await handleToggle(id, 'isFeatured', true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete review');
      toast.success('Review deleted');
      mutate(
        { reviews: reviews.filter((r) => r.id !== id) },
        false
      );
    } catch (err: any) {
      toast.error(err.message || 'Error deleting review');
    }
  };

  const columns: Column<ReviewItem>[] = [
    {
      header: 'Customer',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (r) => (
        <div>
          <span
            className={cn(
              'font-bold block text-xs sm:text-sm',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            {r.customerName}
          </span>
          <span className="text-[10px] text-slate-500">
            {r.customerEmail || 'Verified Buyer'}
          </span>
        </div>
      ),
    },
    {
      header: 'Product',
      cell: (r) => (
        <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs truncate max-w-xs block">
          {r.product?.name || 'Catalog Item'}
        </span>
      ),
    },
    {
      header: 'Rating',
      cell: (r) => (
        <div className="flex text-amber-500">
          {[...Array(r.rating)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-current" />
          ))}
        </div>
      ),
    },
    {
      header: 'Feedback',
      cell: (r) => (
        <div className="max-w-xs sm:max-w-md">
          {r.title && (
            <p
              className={cn(
                'font-bold text-xs truncate',
                isLight ? 'text-slate-900' : 'text-white'
              )}
            >
              {r.title}
            </p>
          )}
          <p
            className={cn(
              'line-clamp-2 text-[11px] mt-0.5',
              isLight ? 'text-slate-600' : 'text-slate-400'
            )}
          >
            {r.content}
          </p>
        </div>
      ),
    },
    {
      header: 'Home Page',
      cell: (r) => (
        <button
          type="button"
          onClick={() => handleToggle(r.id, 'isFeatured', r.isFeatured)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs',
            r.isFeatured
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 hover:bg-amber-500/25'
              : isLight
              ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 hover:text-slate-900'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
          )}
          title={
            r.isFeatured
              ? 'Currently active on Home Page (Click to remove)'
              : 'Click to feature on Home Page (max 6)'
          }
        >
          <Star
            className={cn(
              'w-3.5 h-3.5',
              r.isFeatured ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
            )}
          />
          <span>{r.isFeatured ? 'On Home Page' : '+ Show on Home'}</span>
        </button>
      ),
    },
    {
      header: 'Status',
      cell: (r) => (
        <button
          type="button"
          onClick={() => handleToggle(r.id, 'isApproved', r.isApproved)}
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer',
            r.isApproved
              ? isLight
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-rose-950 text-rose-400 border-rose-800'
              : isLight
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-amber-950 text-amber-400 border-amber-800'
          )}
        >
          {r.isApproved ? 'Approved' : 'Pending'}
        </button>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right px-4 sm:px-6',
      className: 'text-right px-4 sm:px-6',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleDelete(r.id)}
            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Delete Review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={cn(
              'text-2xl font-bold font-serif',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            Customer Reviews &amp; Home Showcase
          </h1>
          <p
            className={cn(
              'text-xs mt-1',
              isLight ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Select exactly which 6 customer reviews are highlighted on the Home Page, or add new verified reviews from your side.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (products.length > 0 && !createForm.productId) {
              setCreateForm((prev) => ({ ...prev, productId: products[0].id }));
            }
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Review</span>
        </button>
      </div>

      {/* Dedicated Home Page 6-Review Slot Showcase */}
      <div
        className={cn(
          'p-5 sm:p-6 rounded-2xl border shadow-sm transition-all',
          isLight
            ? 'bg-white border-rose-200/80 shadow-rose-950/5'
            : 'bg-stone-900/90 border-stone-800 shadow-black/20'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    'font-bold text-sm sm:text-base',
                    isLight ? 'text-stone-900' : 'text-white'
                  )}
                >
                  Home Page Showcase (6 Slots)
                </h3>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
                    homeSelectedCount === 6
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
                  )}
                >
                  {homeSelectedCount} / 6 Selected
                </span>
              </div>
              <p
                className={cn(
                  'text-[11px] mt-0.5',
                  isLight ? 'text-stone-500' : 'text-stone-400'
                )}
              >
                These exact reviews appear in the &ldquo;Loved By Customers Across India&rdquo; section on your home page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {homeSelectedCount < 6 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Select {6 - homeSelectedCount} more from table below</span>
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All 6 slots filled on Home Page</span>
              </span>
            )}
          </div>
        </div>

        {/* 6 Showcase Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, index) => {
            const review = homeFeaturedReviews[index];
            if (review) {
              return (
                <div
                  key={review.id}
                  className={cn(
                    'p-3.5 rounded-xl border relative flex flex-col justify-between group transition-all',
                    isLight
                      ? 'bg-rose-50/40 border-rose-200 hover:border-[#A84358]'
                      : 'bg-stone-800/60 border-stone-700 hover:border-amber-500/50'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="w-5 h-5 rounded-md bg-[#A84358] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                          #{index + 1}
                        </span>
                        <div className="flex text-amber-500">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromHome(review.id)}
                        className="text-stone-400 hover:text-rose-600 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remove from home page"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <h4
                      className={cn(
                        'text-xs font-bold line-clamp-1',
                        isLight ? 'text-stone-900' : 'text-white'
                      )}
                    >
                      {review.title || 'Customer Review'}
                    </h4>

                    <p
                      className={cn(
                        'text-[11px] line-clamp-2 italic mt-1 leading-snug',
                        isLight ? 'text-stone-600' : 'text-stone-400'
                      )}
                    >
                      &ldquo;{review.content}&rdquo;
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-[10px]">
                    <span
                      className={cn(
                        'font-bold truncate max-w-[60%]',
                        isLight ? 'text-stone-800' : 'text-stone-200'
                      )}
                    >
                      {review.customerName}
                    </span>
                    <span className="text-[#A84358] dark:text-rose-400 truncate max-w-[40%] font-semibold">
                      {review.product?.name || 'Ayurvedic Kit'}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`empty-slot-${index}`}
                className={cn(
                  'p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center min-h-[110px] transition-all',
                  isLight
                    ? 'border-stone-300 bg-stone-50/50'
                    : 'border-stone-800 bg-stone-900/30'
                )}
              >
                <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-500 text-[11px] font-bold flex items-center justify-center mb-1 font-mono">
                  #{index + 1}
                </span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    isLight ? 'text-stone-700' : 'text-stone-300'
                  )}
                >
                  Empty Home Slot #{index + 1}
                </span>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Click &ldquo;+ Show on Home&rdquo; on any review in the table below
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Moderation Table */}
      <AdminDataTable
        data={reviews}
        columns={columns}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        searchPlaceholder="Search customer, title, content..."
        searchFilter={(r, q) =>
          r.customerName.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          (r.title ? r.title.toLowerCase().includes(q) : false) ||
          (r.product?.name ? r.product.name.toLowerCase().includes(q) : false)
        }
        statusTabs={['ALL', 'HOME_PAGE_SHOWCASE', 'APPROVED', 'PENDING']}
        activeStatus={activeTab}
        onStatusChange={setActiveTab}
        statusFilter={(r, st) => {
          if (st === 'APPROVED') return r.isApproved;
          if (st === 'PENDING') return !r.isApproved;
          if (st === 'HOME_PAGE_SHOWCASE') return r.isFeatured;
          return true;
        }}
        emptyMessage="No customer reviews found."
      />

      {/* Add New Review Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={cn(
              'relative w-full max-w-xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-5 my-8',
              isLight ? 'bg-white border-[#EAC9D1]' : 'bg-slate-900 border-slate-800'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EAC9D1]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className={cn('text-base font-bold', isLight ? 'text-slate-900' : 'text-white')}>
                    Add New Customer Review
                  </h3>
                  <p className="text-[11px] text-slate-500">Add a verified review or testimonial from admin side</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={createForm.productId}
                  onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })}
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition-colors',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                  )}
                >
                  <option value="">-- Select Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.customerName}
                    onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                    placeholder="e.g. Ananya Sen"
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email or Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={createForm.customerEmail}
                    onChange={(e) => setCreateForm({ ...createForm, customerEmail: e.target.value })}
                    placeholder="e.g. ananya@gmail.com or Kolkata"
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Star Rating (1-5)
                  </label>
                  <select
                    value={createForm.rating}
                    onChange={(e) => setCreateForm({ ...createForm, rating: Number(e.target.value) })}
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-none transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Review Headline / Title
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g. Hair fall reduced noticeably in 3 weeks!"
                    className={cn(
                      'w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Review Content / Testimonial <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  placeholder="Share details about the texture, smell, application routine, and observed results..."
                  className={cn(
                    'w-full p-3.5 rounded-xl border text-xs outline-none resize-none transition-colors leading-relaxed',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                  )}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={createForm.isVerifiedPurchase}
                    onChange={(e) => setCreateForm({ ...createForm, isVerifiedPurchase: e.target.checked })}
                    className="accent-[#8C3A4F] rounded-sm"
                  />
                  <span>Mark as &quot;Verified Buyer&quot; badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={createForm.isApproved}
                    onChange={(e) => setCreateForm({ ...createForm, isApproved: e.target.checked })}
                    className="accent-[#8C3A4F] rounded-sm"
                  />
                  <span>Publish &amp; approve immediately</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={createForm.isFeatured}
                    onChange={(e) => setCreateForm({ ...createForm, isFeatured: e.target.checked })}
                    className="accent-[#8C3A4F] rounded-sm"
                  />
                  <span>Feature on Home Page Reviews Showcase</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? 'Saving Review...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
