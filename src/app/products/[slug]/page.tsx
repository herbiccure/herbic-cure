import React, { cache } from 'react';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import ProductReviewsSection from '@/components/product/ProductReviewsSection';
import type { Metadata } from 'next';

export const revalidate = 120;

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { slug: true },
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch (error) {
    console.warn('Failed to pre-generate product static params:', error);
    return [];
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

// Request-memoized and in-memory cached product fetcher
const getProduct = cache(async (slug: string) => {
  return unstable_cache(
    async () => {
      try {
        return await prisma.product.findUnique({
          where: { slug },
          include: {
            images: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        });
      } catch (err) {
        console.warn(`Database unreachable fetching product ${slug}:`, (err as any)?.message || String(err));
        return null;
      }
    },
    [`product-${slug}`],
    { revalidate: 120, tags: ['products', `product-${slug}`] }
  )();
});

const getReviews = cache(async (productId: string) => {
  return unstable_cache(
    async () => {
      try {
        return await prisma.review.findMany({
          where: {
            productId,
            isApproved: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err) {
        console.warn(`Database unreachable fetching reviews for ${productId}:`, (err as any)?.message || String(err));
        return [];
      }
    },
    [`reviews-${productId}`],
    { revalidate: 120, tags: ['reviews', `product-${productId}-reviews`] }
  )();
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Herbic Cure',
      robots: { index: false, follow: false },
    };
  }

  const title = product.seoTitle || `${product.name} | Herbic Cure`;
  const description =
    product.seoDescription ||
    product.shortDescription ||
    `Buy authentic ${product.name} online. 100% natural Ayurvedic formulation with 21 medicinal herbs.`;
  const imageUrl = product.images[0]?.url || '/images/banners/herbic-hero-banner-1.jpg';

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/products/${product.slug}`,
      images: [{ url: imageUrl, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const reviews = await getReviews(product.id);

  return (
    <main className="min-h-screen bg-[#FCF8F9]">
      <ProductDetailClient product={product} />
      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
        initialReviews={reviews}
      />
    </main>
  );
}
