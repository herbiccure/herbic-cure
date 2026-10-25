import { logger } from '@/lib/logger';
import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/product/ProductCard';

export const revalidate = 120;


export const metadata: Metadata = {
  title: 'All Ayurvedic Collections | Herbic Cure',
  description: 'Explore the full spectrum of 21 Herbs Fusion hair oils, herbal shampoos, combs, and therapy kits.',
  alternates: {
    canonical: '/collections',
  },
};

export default async function CollectionsPage() {
  let categories: any[] = [];
  let products: any[] = [];
  try {
    const [fetchedCategories, fetchedProducts] = await Promise.all([
      prisma.category.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.product.findMany({
        where: { active: true },
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
        orderBy: { displayOrder: 'asc' },
      }),
    ]);
    categories = fetchedCategories;
    products = fetchedProducts;
  } catch (err) {
    logger.debug('collections.query_deferred', { error: (err as any)?.message });
  }

  return (
    <div className="min-h-screen bg-[#FCF8F9] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-3 inline-block">
            Curated Ayurvedic Regimens
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            HERBAL COLLECTIONS
          </h1>
          <p className="text-sm text-stone-600 mt-2">
            Targeted formulations to reverse hair thinning, calm inflamed scalps, and promote dense follicle growth.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Link
            href="/products"
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#A84358] text-white shadow-sm"
          >
            All Formulations ({products.length})
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors shadow-xs"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              id={prod.id}
              name={prod.name}
              slug={prod.slug}
              regularPrice={prod.regularPrice}
              salePrice={prod.salePrice}
              image={prod.images[0]?.url || '/images/banners/banner-1.png'}
              rating={prod.rating}
              reviewCount={prod.reviewCount}
              isBestSeller={prod.isBestSeller}
              isOnSale={prod.isOnSale}
              hasTimer={prod.hasTimer}
              stockQuantity={prod.stockQuantity}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
