import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import ProductReviewsSection from '@/components/product/ProductReviewsSection';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
        take: 1,
      },
    },
  });

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

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const reviews = await prisma.review.findMany({
    where: {
      productId: product.id,
      isApproved: true,
    },
    orderBy: { createdAt: 'desc' },
  });

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
