import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    return {
      title: 'Product Not Found | Herbic Cure',
    };
  }

  return {
    title: `${product.name} | Herbic Cure Ayurvedic Care`,
    description:
      product.shortDescription ||
      `Buy authentic ${product.name} online. 100% natural Ayurvedic formulation with 21 medicinal herbs.`,
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

  return (
    <main className="min-h-screen bg-[#FCF8F9]">
      <ProductDetailClient product={product} />
    </main>
  );
}
