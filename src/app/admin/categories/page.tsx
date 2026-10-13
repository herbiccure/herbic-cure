'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  EyeOff,
  MoveUp,
  MoveDown,
  ExternalLink,
  Package,
  Sparkles,
  Layers,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  displayOrder: number;
  active: boolean;
  products?: { id: string }[];
}

export default function AdminCategoriesPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading, mutate } = useSWR<{ categories: CategoryItem[] }>(
    '/api/admin/categories',
    fetcher
  );
  const categories = data?.categories ?? [];

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '/images/products/herbic-cure/herbic-cure-oil-q1-main.jpg',
      active: true,
    });
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      active: cat.active,
    });
    setModalOpen(true);
  };

  const handleNameChange = (nameVal: string) => {
    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      slug:
        !editingCategory &&
        (!prev.slug || prev.slug === prev.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'))
          ? nameVal
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
          : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        description: formData.description.trim() || null,
        image: formData.image.trim() || null,
        active: formData.active,
      };

      if (editingCategory) {
        // Edit PUT
        const res = await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...payload }),
        });
        if (!res.ok) throw new Error('Failed to update category');
        toast.success(`Category "${payload.name}" updated!`);
      } else {
        // Create POST
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create category');
        toast.success(`Category "${payload.name}" created!`);
      }

      setModalOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Live / Hidden Status
  const handleToggleActive = async (cat: CategoryItem) => {
    const nextVal = !cat.active;
    mutate(
      {
        categories: categories.map((c) => (c.id === cat.id ? { ...c, active: nextVal } : c)),
      },
      false
    );

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, active: nextVal }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(
        nextVal
          ? `Category "${cat.name}" is now Live on Storefront`
          : `Category "${cat.name}" is now Hidden`
      );
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
      mutate();
    }
  };

  // Move Category Up / Down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const copy = [...categories];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    mutate({ categories: copy }, false);

    try {
      const reorderedIds = copy.map((c) => c.id);
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: reorderedIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder categories');
      toast.success(`Moved "${temp.name}" ${direction}`);
    } catch (err: any) {
      toast.error('Failed to save category order');
      mutate();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteId }),
      });
      if (!res.ok) throw new Error('Failed to delete category');
      toast.success('Category removed from catalog');
      mutate(
        { categories: categories.filter((c) => c.id !== deleteId) },
        false
      );
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting category');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalProducts = categories.reduce((sum, c) => sum + (c.products?.length || 0), 0);
  const activeCount = categories.filter((c) => c.active).length;

  const columns: Column<CategoryItem>[] = [
    {
      header: 'Order',
      cell: (cat, idx) => (
        <div className="flex items-center gap-1.5">
          <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
            {idx !== undefined ? idx + 1 : cat.displayOrder}
          </span>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => idx !== undefined && handleMove(idx, 'up')}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-20 cursor-pointer transition-colors"
              title="Move Up on Home Grid"
            >
              <MoveUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              disabled={idx === categories.length - 1}
              onClick={() => idx !== undefined && handleMove(idx, 'down')}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-20 cursor-pointer transition-colors"
              title="Move Down on Home Grid"
            >
              <MoveDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (cat) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border shadow-2xs',
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
            )}
          >
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <ImageIcon className="w-5 h-5" />
              </div>
            )}
          </div>
          <div>
            <span
              className={cn(
                'font-bold block text-xs sm:text-sm leading-snug',
                isLight ? 'text-slate-900' : 'text-white'
              )}
            >
              {cat.name}
            </span>
            {cat.description && (
              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                {cat.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Storefront Route',
      cell: (cat) => (
        <Link
          href={`/collections/${cat.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-[#A84358] hover:underline"
        >
          <span>/collections/{cat.slug}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
    {
      header: 'Products',
      cell: (cat) => (
        <Link
          href={`/admin/products?category=${cat.id}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Click to view products in this category"
        >
          <Package className="w-3.5 h-3.5 text-[#A84358]" />
          <span>{cat.products?.length || 0} formulations</span>
        </Link>
      ),
    },
    {
      header: 'Status',
      cell: (cat) => (
        <button
          type="button"
          onClick={() => handleToggleActive(cat)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer shadow-2xs',
            cat.active
              ? isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-emerald-950/70 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
              : isLight
              ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
          )}
          title={
            cat.active
              ? 'Visible on Homepage "Shop by Category" grid. Click to hide.'
              : 'Hidden from Storefront. Click to make Live.'
          }
        >
          {cat.active ? (
            <CheckCircle className="w-3 h-3 text-emerald-600" />
          ) : (
            <EyeOff className="w-3 h-3 text-slate-400" />
          )}
          <span>{cat.active ? 'Live on Store' : 'Hidden'}</span>
        </button>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right px-4 sm:px-6',
      className: 'text-right px-4 sm:px-6',
      cell: (cat) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(cat)}
            className={cn(
              'p-2 rounded-xl transition-colors cursor-pointer',
              isLight
                ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            )}
            title="Edit Category Details"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteId(cat.id)}
            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={cn(
              'text-2xl font-bold font-serif',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            Categories Management
          </h1>
          <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
            Manage product browsing categories that power the Home &ldquo;Shop by Category&rdquo; section and store navigation.
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
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#A84358] hover:bg-[#8C374A] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs hover:shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={cn(
            'p-4 rounded-2xl border shadow-2xs',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Categories</span>
            <FolderTree className="w-4 h-4 text-[#A84358]" />
          </div>
          <div
            className={cn(
              'text-2xl font-extrabold',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            {categories.length}
          </div>
          <span className="text-[10px] text-slate-500">Master product categories</span>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border shadow-2xs',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Live on Home Grid</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
          <span className="text-[10px] text-slate-500">Active in &ldquo;Shop by Category&rdquo;</span>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border shadow-2xs',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Products</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <div
            className={cn(
              'text-2xl font-extrabold',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            {totalProducts}
          </div>
          <span className="text-[10px] text-slate-500">Formulations mapped to categories</span>
        </div>
      </div>

      {/* Categories Data Table */}
      <AdminDataTable
        data={categories}
        columns={columns}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        searchPlaceholder="Search category name or slug..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
        }
        emptyMessage="No categories defined yet. Click 'Add Category' to create your first category."
      />

      {/* ========================================================================= */}
      {/* ADD / EDIT CATEGORY MODAL                                                 */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={cn(
              'rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border transition-colors',
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-white'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-[#A84358] flex items-center justify-center shrink-0">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Appears in the Home Page Category Grid and Navigation Taskbar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. 21 Herbs Hair Oils"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl text-xs border transition-all focus:outline-hidden',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  URL Route Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. hair-oils"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl text-xs font-mono border transition-all focus:outline-hidden',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  )}
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Accessible at /collections/{formData.slug || 'category-slug'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Description / Tagline</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Cold-pressed authentic herbal formulations for root health and hair fall control."
                  className={cn(
                    'w-full p-3 rounded-xl text-xs border transition-all focus:outline-hidden',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  )}
                />
              </div>

              {/* Image Preview & URL */}
              <div>
                <label className="block text-xs font-bold mb-1">Category Image URL</label>
                <div className="flex gap-3 items-center">
                  <div
                    className={cn(
                      'relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border shadow-2xs',
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                    )}
                  >
                    {formData.image ? (
                      <Image
                        src={formData.image}
                        alt="Category Preview"
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="/images/products/herbic-cure/herbic-cure-oil-q1-main.jpg"
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-xl text-xs border transition-all focus:outline-hidden',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-white'
                    )}
                  />
                </div>
              </div>

              {/* Live Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold block">Live on Storefront</span>
                  <span className="text-[10px] text-slate-500">
                    Display this category card in the Home Page &ldquo;Shop by Category&rdquo; grid
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 rounded text-[#A84358] accent-[#A84358] cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#A84358] hover:bg-[#8C374A] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : editingCategory
                    ? 'Save Category'
                    : 'Create Category'}
                </button>
              </div>
            </form>
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
              <h3 className="font-bold text-base">Delete Category?</h3>
              <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
                This category will be removed from navigation and the home page. Products assigned to it will remain in your catalog.
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
