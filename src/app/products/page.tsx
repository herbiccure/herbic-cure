import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Ayurvedic Formulations & Therapy Kits | Herbic Cure',
  description:
    'Explore the complete range of Herbic Cure Ayurvedic hair oils, handcrafted neem wood combs, sulfate-free cleansers, and complete hair therapy kits.',
  alternates: {
    canonical: '/products',
  },
};

import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import ProductCard from '@/components/product/ProductCard';
import ProductSortSelect from '@/components/product/ProductSortSelect';
import { ArrowUpDown, X } from 'lucide-react';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
  }>;
}

const SYNONYMS: Record<string, string[]> = {
  trio: ['kit', 'complete', 'comb', 'shampoo'],
  massager: ['comb', 'wooden', 'scalp'],
  biotin: ['oil', 'shampoo'],
  dandruff: ['neem', 'oil', 'shampoo'],
  growth: ['oil', 'hair oil', '21 herbs'],
  regrowth: ['oil', 'hair oil'],
  fall: ['anti hair fall', 'hair oil'],
  hairfall: ['anti hair fall', 'hair oil'],
  combo: ['combos', 'kit', 'pack'],
  combos: ['combo', 'kit', 'pack'],
  kit: ['combos', 'complete', 'combo'],
  kits: ['combos', 'complete', 'combo'],
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const categoryFilter = resolvedParams.category;
  const searchQuery = resolvedParams.search?.trim();
  const sortBy = resolvedParams.sort || 'featured';

  // Build Prisma where query with case-insensitive matching
  const whereClause: any = { active: true };

  if (categoryFilter) {
    whereClause.category = { slug: categoryFilter };
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const rawWords = q.split(/\s+/).filter((w) => w.length > 0);

    const searchTerms = new Set<string>([q, ...rawWords]);
    for (const w of rawWords) {
      if (SYNONYMS[w]) {
        SYNONYMS[w].forEach((syn) => searchTerms.add(syn));
      }
    }
    const termsList = Array.from(searchTerms);

    const orConditions: any[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { shortDescription: { contains: q, mode: 'insensitive' } },
      { fullDescription: { contains: q, mode: 'insensitive' } },
      { benefits: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
      { category: { slug: { contains: q, mode: 'insensitive' } } },
    ];

    for (const term of termsList) {
      orConditions.push(
        { name: { contains: term, mode: 'insensitive' } },
        { shortDescription: { contains: term, mode: 'insensitive' } },
        { category: { name: { contains: term, mode: 'insensitive' } } }
      );
    }

    whereClause.OR = orConditions;
  }

  // Sorting
  let orderByClause: any = { displayOrder: 'asc' };
  if (sortBy === 'price-low') {
    orderByClause = { salePrice: 'asc' };
  } else if (sortBy === 'price-high') {
    orderByClause = { salePrice: 'desc' };
  } else if (sortBy === 'rating') {
    orderByClause = { rating: 'desc' };
  } else if (sortBy === 'newest') {
    orderByClause = { createdAt: 'desc' };
  }

  let products: any[] = [];
  let categories: any[] = [];
  try {
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          regularPrice: true,
          salePrice: true,
          stockQuantity: true,
          isBestSeller: true,
          isFeatured: true,
          isOnSale: true,
          hasTimer: true,
          rating: true,
          reviewCount: true,
          displayOrder: true,
          images: {
            select: { url: true, alt: true },
            orderBy: { displayOrder: 'asc' },
            take: 1,
          },
        },
        orderBy: orderByClause,
      }),
      prisma.category.findMany({
        where: { active: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);
    products = fetchedProducts;
    categories = fetchedCategories;
  } catch (err) {
    logger.debug('products.query_deferred', { error: (err as any)?.message });
  }

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'newest', label: 'Newest First' },
  ];

  const buildSortUrl = (newSort: string) => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set('category', categoryFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (newSort !== 'featured') params.set('sort', newSort);
    const query = params.toString();
    return `/products${query ? `?${query}` : ''}`;
  };

  const buildCategoryUrl = (catSlug?: string) => {
    const params = new URLSearchParams();
    if (catSlug) params.set('category', catSlug);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'featured') params.set('sort', sortBy);
    const query = params.toString();
    return `/products${query ? `?${query}` : ''}`;
  };

  return (
    <div className="bg-[#FCF8F9] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs & Title */}
        <div className="mb-6 sm:mb-8">
          <nav className="text-xs text-stone-500 mb-2 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#A84358] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="text-stone-700 hover:text-[#A84358] font-medium transition-colors">Products</Link>
            {categoryFilter && (
              <>
                <span>/</span>
                <span className="text-[#A84358] font-bold capitalize">
                  {categories.find(c => c.slug === categoryFilter)?.name || categoryFilter.replace(/-/g, ' ')}
                </span>
              </>
            )}
          </nav>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif tracking-tight">
            All Ayurvedic Formulations
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Explore authentic Vedic 21 Ayurvedic herbs hair oils, pure neem wood massage tools, and complete hair regrowth therapy kits.
          </p>
        </div>

        {/* Filter and Sorting Card */}
        <div className="bg-white rounded-2xl border border-stone-200/80 mb-6 sm:mb-8 shadow-xs overflow-hidden">
          {/* Category Filter Pills (Horizontal Scroll Track) */}
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-3.5 py-3 sm:px-4 sm:py-3.5 touch-pan-x">
              <Link
                href={buildCategoryUrl()}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  !categoryFilter
                    ? 'bg-[#A84358] text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700'
                }`}
              >
                All ({products.length})
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={buildCategoryUrl(c.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    categoryFilter === c.slug
                      ? 'bg-[#A84358] text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
            {/* Subtle right-edge scroll cue for mobile */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent sm:hidden" />
          </div>

          {/* Hairline Divider */}
          <div className="border-t border-stone-100" />

          {/* Active Search & Sort Toolbar */}
          <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 bg-stone-50/50">
            {/* Left: Active Search Query or Product Count */}
            <div className="flex items-center gap-2 min-w-0">
              {searchQuery ? (
                <div className="flex items-center gap-1.5 bg-rose-50 text-[#A84358] text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200 truncate">
                  <span className="truncate max-w-[140px] sm:max-w-none">
                    Search: &ldquo;{searchQuery}&rdquo;
                  </span>
                  <Link
                    href={buildCategoryUrl(categoryFilter)}
                    className="hover:text-red-600 shrink-0"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <span className="text-xs text-stone-500 font-medium">
                  Showing <strong className="font-bold text-stone-800">{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
                </span>
              )}
            </div>

            {/* Right: Sort Section */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile Sort Dropdown */}
              <div className="sm:hidden">
                <ProductSortSelect
                  currentSort={sortBy}
                  categoryFilter={categoryFilter}
                  searchQuery={searchQuery}
                />
              </div>

              {/* Desktop Sort Pills */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-stone-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="text-stone-500 shrink-0">Sort:</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-200/80 shadow-2xs">
                  {sortOptions.map((opt) => (
                    <Link
                      key={opt.value}
                      href={buildSortUrl(opt.value)}
                      className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-all ${
                        sortBy === opt.value
                          ? 'bg-stone-800 text-white font-bold shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-stone-200/80 my-8">
            <h3 className="text-lg font-bold text-stone-800">No products match &ldquo;{searchQuery}&rdquo;</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Try searching for &quot;hair oil&quot;, &quot;neem comb&quot;, &quot;shampoo&quot;, or &quot;combos&quot;.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-block px-6 py-2.5 bg-[#A84358] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#45363B] transition-all"
            >
              View All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                regularPrice={p.regularPrice}
                salePrice={p.salePrice}
                image={p.images[0]?.url || '/images/banners/banner-1.png'}
                rating={p.rating}
                reviewCount={p.reviewCount}
                isBestSeller={p.isBestSeller}
                isOnSale={p.isOnSale}
                hasTimer={p.hasTimer}
                stockQuantity={p.stockQuantity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
