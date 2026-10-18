'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Save,
  ArrowLeft,
  Flame,
  Tag,
  Star,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Image as ImageIcon,
  Package,
  Eye,
  Percent,
  Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface ProductFormProps {
  isEdit?: boolean;
  initialData?: any;
}

export default function ProductForm({ isEdit = false, initialData }: ProductFormProps) {
  const router = useRouter();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [regularPrice, setRegularPrice] = useState(
    initialData?.regularPrice !== undefined ? String(initialData.regularPrice) : ''
  );
  const [salePrice, setSalePrice] = useState(
    initialData?.salePrice !== undefined && initialData?.salePrice !== null
      ? String(initialData.salePrice)
      : ''
  );
  const [costPrice, setCostPrice] = useState(
    initialData?.costPrice !== undefined && initialData?.costPrice !== null
      ? String(initialData.costPrice)
      : ''
  );
  const [isOnSale, setIsOnSale] = useState(
    initialData?.isOnSale !== undefined
      ? Boolean(initialData.isOnSale)
      : Boolean(initialData?.salePrice && initialData?.salePrice < initialData?.regularPrice)
  );
  const [isBestSeller, setIsBestSeller] = useState(Boolean(initialData?.isBestSeller));
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.isFeatured));
  const [isNew, setIsNew] = useState(Boolean(initialData?.isNew));
  const [hasTimer, setHasTimer] = useState(Boolean(initialData?.hasTimer));
  const [active, setActive] = useState(
    initialData?.active !== undefined ? Boolean(initialData.active) : true
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialData?.stockQuantity !== undefined ? String(initialData.stockQuantity) : '100'
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialData?.lowStockThreshold !== undefined ? String(initialData.lowStockThreshold) : '10'
  );
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [fullDescription, setFullDescription] = useState(initialData?.fullDescription || '');
  const [howToUse, setHowToUse] = useState(initialData?.howToUse || '');
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '');

  // Images state
  const initialImages: string[] = initialData?.images?.map((img: any) => img.url) || [];
  const [images, setImages] = useState<string[]>(
    initialImages.length > 0 ? initialImages : ['/images/banners/banner-1.png']
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isDragOverImages, setIsDragOverImages] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleMultipleFilesUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgressText(`Uploading ${i + 1} of ${validFiles.length}: ${file.name}...`);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          toast.error(data.error || `Failed to upload ${file.name}`);
        }
      } catch (err: any) {
        toast.error(err.message || `Error uploading ${file.name}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setImages(prev => [...prev, ...uploadedUrls]);
      toast.success(`Successfully uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''}`);
    }

    setIsUploadingImages(false);
    setUploadProgressText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Fetch categories
  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  // Auto-slugify on title change if creating or if slug is empty
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit && (!slug || slug === name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'))) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  // Discount percentage calculation
  const regNum = parseFloat(regularPrice);
  const saleNum = parseFloat(salePrice);
  const discountPercent =
    regNum > 0 && saleNum > 0 && saleNum < regNum
      ? Math.round(((regNum - saleNum) / regNum) * 100)
      : null;

  const handleApplyPresetDiscount = (percent: number) => {
    if (!regNum || regNum <= 0) {
      toast.error('Please enter a Regular Price (MRP) first');
      return;
    }
    const computedSale = Math.round(regNum * (1 - percent / 100));
    setSalePrice(String(computedSale));
    setIsOnSale(true);
    toast.success(`Applied ${percent}% OFF deal (₹${computedSale})`);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product title is required');
      return;
    }
    if (!regularPrice || isNaN(Number(regularPrice))) {
      toast.error('A valid Regular Price (MRP) is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        sku: sku.trim() || undefined,
        categoryId: categoryId || null,
        regularPrice: Number(regularPrice),
        salePrice: salePrice && !isNaN(Number(salePrice)) ? Number(salePrice) : null,
        costPrice: costPrice && !isNaN(Number(costPrice)) ? Number(costPrice) : null,
        isOnSale: Boolean(isOnSale && salePrice && Number(salePrice) < Number(regularPrice)),
        isBestSeller: Boolean(isBestSeller),
        isFeatured: Boolean(isFeatured),
        isNew: Boolean(isNew),
        hasTimer: Boolean(hasTimer),
        active: Boolean(active),
        stockQuantity: Number(stockQuantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 10,
        shortDescription: shortDescription.trim() || null,
        fullDescription: fullDescription.trim() || null,
        howToUse: howToUse.trim() || null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        images: images.filter((img) => img.trim().length > 0),
      };

      let res;
      if (isEdit && initialData?.id) {
        res = await fetch(`/api/admin/products/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      toast.success(isEdit ? 'Product updated successfully!' : 'New formulation created!');
      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className={cn(
              'p-2 rounded-xl transition-colors',
              isLight
                ? 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1
              className={cn(
                'text-2xl font-bold font-serif',
                isLight ? 'text-slate-900' : 'text-white'
              )}
            >
              {isEdit ? 'Edit Ayurvedic Formulation' : 'Add New Ayurvedic Formulation'}
            </h1>
            <p className={cn('text-xs mt-0.5', isLight ? 'text-slate-500' : 'text-slate-400')}>
              Configure catalog pricing, special promotional deals, best-seller status, and visibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-colors',
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            )}
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. MERCHANDISING FLAGS & STORE STATUS BANNER                              */}
        {/* ========================================================================= */}
        <div
          className={cn(
            'p-5 rounded-2xl border shadow-xs',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <h2
            className={cn(
              'text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2',
              isLight ? 'text-slate-600' : 'text-slate-400'
            )}
          >
            <Sparkles className="w-4 h-4 text-[#A84358]" />
            <span>Storefront Placement &amp; Merchandising Badges</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Best Seller Toggle */}
            <div
              onClick={() => setIsBestSeller(!isBestSeller)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3',
                isBestSeller
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-2xs'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-400'
              )}
            >
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Flame
                    className={cn(
                      'w-4 h-4',
                      isBestSeller ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                    )}
                  />
                  <span>Best Seller</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Featured on Home Page &ldquo;Best-Selling Formulations&rdquo; section
                </p>
              </div>
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={() => {}}
                className="w-4 h-4 rounded text-amber-600 accent-amber-600 mt-0.5 cursor-pointer"
              />
            </div>

            {/* Put on Deal / On Sale Toggle */}
            <div
              onClick={() => setIsOnSale(!isOnSale)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3',
                isOnSale
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-200 shadow-2xs'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-400'
              )}
            >
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Tag
                    className={cn(
                      'w-4 h-4',
                      isOnSale ? 'text-rose-500' : 'text-slate-400'
                    )}
                  />
                  <span>Active Deal / Sale</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Shows special discount badge &amp; strikethrough price
                </p>
              </div>
              <input
                type="checkbox"
                checked={isOnSale}
                onChange={() => {}}
                className="w-4 h-4 rounded text-rose-600 accent-rose-600 mt-0.5 cursor-pointer"
              />
            </div>

            {/* Urgency Countdown Timer Toggle */}
            <div
              onClick={() => setHasTimer(!hasTimer)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3',
                hasTimer
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-2xs'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-400'
              )}
            >
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Clock
                    className={cn(
                      'w-4 h-4',
                      hasTimer ? 'text-amber-500' : 'text-slate-400'
                    )}
                  />
                  <span>Urgency Timer</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Displays live &ldquo;Ends in 04m 00s&rdquo; countdown badge on product
                </p>
              </div>
              <input
                type="checkbox"
                checked={hasTimer}
                onChange={() => {}}
                className="w-4 h-4 rounded text-amber-600 accent-amber-600 mt-0.5 cursor-pointer"
              />
            </div>

            {/* Featured Product */}
            <div
              onClick={() => setIsFeatured(!isFeatured)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3',
                isFeatured
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-200 shadow-2xs'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-400'
              )}
            >
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Star
                    className={cn(
                      'w-4 h-4',
                      isFeatured ? 'text-purple-500 fill-purple-500' : 'text-slate-400'
                    )}
                  />
                  <span>Featured Product</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Highlighted in collection grids &amp; recommendations
                </p>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={() => {}}
                className="w-4 h-4 rounded text-purple-600 accent-purple-600 mt-0.5 cursor-pointer"
              />
            </div>

            {/* Storefront Active / Draft */}
            <div
              onClick={() => setActive(!active)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3',
                active
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-2xs'
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-400'
              )}
            >
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Eye className={cn('w-4 h-4', active ? 'text-emerald-500' : 'text-rose-500')} />
                  <span>{active ? 'Live on Store' : 'Draft (Hidden)'}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  {active ? 'Visible to customers for purchase' : 'Hidden from storefront search & collections'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={active}
                onChange={() => {}}
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 mt-0.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BASIC INFORMATION                                                     */}
        {/* ========================================================================= */}
        <div
          className={cn(
            'p-5 rounded-2xl border shadow-xs space-y-4',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <h2
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              isLight ? 'text-slate-600' : 'text-slate-400'
            )}
          >
            Product Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. 100% Ayurvedic Hair Growth Oil (200ml)"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-xs border transition-all focus:outline-hidden focus:ring-2 focus:ring-[#A84358]/40',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ayurvedic-hair-growth-oil"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-xs font-mono border transition-all focus:outline-hidden',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SKU Variant Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="HERB-OIL-200"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-xs font-mono border transition-all focus:outline-hidden',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ayurvedic Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-xs border transition-all focus:outline-hidden',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              >
                <option value="">Unassigned / All Collections</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Inventory Stock (Units)
              </label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-xs border transition-all focus:outline-hidden',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. PRICING & SPECIAL PROMOTIONAL DEALS                                    */}
        {/* ========================================================================= */}
        <div
          className={cn(
            'p-5 rounded-2xl border shadow-xs space-y-4',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2
              className={cn(
                'text-xs font-bold uppercase tracking-wider flex items-center gap-2',
                isLight ? 'text-slate-600' : 'text-slate-400'
              )}
            >
              <Tag className="w-4 h-4 text-[#A84358]" />
              <span>Pricing &amp; Promotional Deals Manager</span>
            </h2>
            {discountPercent && discountPercent > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Active Deal: {discountPercent}% OFF (Save ₹{regNum - saleNum})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Regular MRP (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                placeholder="999"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-xs font-bold border transition-all focus:outline-hidden',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deal / Selling Price (₹)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => {
                  setSalePrice(e.target.value);
                  if (e.target.value && Number(e.target.value) < Number(regularPrice)) {
                    setIsOnSale(true);
                  }
                }}
                placeholder="699"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-xs font-bold border transition-all focus:outline-hidden',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Internal Cost Price (₹)
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="250"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-xs border transition-all focus:outline-hidden',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>
          </div>

          {/* Quick Preset Deal Buttons */}
          <div className="pt-2">
            <span className="block text-[11px] font-bold text-slate-500 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 inline mr-1" /> Quick Deal Presets (Calculates Deal Price automatically):
            </span>
            <div className="flex flex-wrap gap-2">
              {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleApplyPresetDiscount(pct)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                    discountPercent === pct
                      ? 'bg-[#A84358] text-white border-[#A84358]'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  )}
                >
                  {pct}% OFF
                </button>
              ))}
              {salePrice && (
                <button
                  type="button"
                  onClick={() => {
                    setSalePrice('');
                    setIsOnSale(false);
                    toast.success('Promotional deal removed');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-all cursor-pointer"
                >
                  Clear Deal
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PRODUCT IMAGES & GALLERY                                               */}
        {/* ========================================================================= */}
        <div
          className={cn(
            'p-5 rounded-2xl border shadow-xs space-y-4',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <h2
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              isLight ? 'text-slate-600' : 'text-slate-400'
            )}
          >
            Product Photography &amp; Gallery
          </h2>

          <div className="flex flex-wrap gap-3">
            {images.map((imgUrl, index) => (
              <div
                key={index}
                className={cn(
                  'relative w-24 h-24 rounded-2xl overflow-hidden border group shadow-2xs',
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                )}
              >
                <Image
                  src={imgUrl}
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-1 left-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove Image"
                >
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste Image URL (e.g. /images/products/my-product.png or https://...)"
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl text-xs border transition-all focus:outline-hidden',
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-800 border-slate-700 text-white'
              )}
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Image</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. DESCRIPTIONS & AYURVEDIC DIRECTIONS                                   */}
        {/* ========================================================================= */}
        <div
          className={cn(
            'p-5 rounded-2xl border shadow-xs space-y-4',
            isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
          )}
        >
          <h2
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              isLight ? 'text-slate-600' : 'text-slate-400'
            )}
          >
            Product Story &amp; How To Use
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Short Summary Description
            </label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Authentic cold-pressed 21 Himalayan herbs oil designed to halt hair fall and stimulate deep follicles."
              className={cn(
                'w-full p-3 rounded-xl text-xs border transition-all focus:outline-hidden',
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-800 border-slate-700 text-white'
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              How To Use Directions
            </label>
            <textarea
              rows={2}
              value={howToUse}
              onChange={(e) => setHowToUse(e.target.value)}
              placeholder="e.g. Apply 5-10 ml oil directly onto scalp with applicator root comb. Gently massage in circular motions for 5 minutes."
              className={cn(
                'w-full p-3 rounded-xl text-xs border transition-all focus:outline-hidden',
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-800 border-slate-700 text-white'
              )}
            />
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/products"
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs font-bold transition-colors',
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            )}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
