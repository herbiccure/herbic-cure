import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/product/ProductCard';


interface CollectionDetailPageProps {
  params: Promise<{ slug: string }>;
}

import type { Metadata } from 'next';

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({
    where: { slug },
  });

  if (!collection) {
    return {
      title: 'Collection Not Found | Herbic Cure',
      robots: { index: false, follow: false },
    };
  }

  const title = `${collection.name} | Herbic Cure Herbal Collections`;
  const description =
    collection.description ||
    `Discover Herbic Cure ${collection.name}. Authentic Ayurvedic formulations made with 21 rare herbs for scalp and hair vitality.`;
  const imageUrl = collection.bannerImage || collection.image || '/images/banners/banner-1.png';

  return {
    title,
    description,
    alternates: {
      canonical: `/collections/${collection.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/collections/${collection.slug}`,
      images: [{ url: imageUrl, alt: collection.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { slug } = await params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: {
            include: { images: { orderBy: { displayOrder: 'asc' } } },
          },
        },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  const products = collection.products.map((p) => p.product).filter((p) => p.active);

  return (
    <div className="bg-[#FCF8F9] min-h-screen pb-16">
      {/* Full-width Responsive Banner */}
      <div className="relative w-full min-h-[260px] sm:min-h-[320px] md:min-h-[380px] bg-stone-950 flex items-center overflow-hidden">
        <Image
          src={collection.bannerImage || collection.image || '/images/banners/banner-1.png'}
          alt={collection.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/75 to-stone-950/40" />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white py-10 sm:py-16">
          <nav className="text-xs text-rose-300 mb-2.5 flex items-center gap-1.5 font-medium">
            <Link href="/" className="hover:underline hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/collections" className="hover:underline hover:text-white transition-colors">Collections</Link>
            <span>/</span>
            <span className="text-white font-bold">{collection.name}</span>
          </nav>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold font-serif text-white tracking-tight drop-shadow-sm">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-xs sm:text-sm md:text-base text-rose-100/90 mt-2 max-w-2xl leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Showing {products.length} Products
          </span>
          <Link
            href="/products"
            className="text-xs font-bold text-[#A84358] hover:underline uppercase tracking-wider"
          >
            View All Catalog →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
            <h3 className="text-base font-bold text-stone-800">No products found in this collection</h3>
            <Link
              href="/products"
              className="mt-4 inline-block px-5 py-2 bg-[#A84358] text-white rounded-lg text-xs font-bold"
            >
              Browse All Products
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
