import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductForm from '@/components/admin/ProductForm';


interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (!product) {
    notFound();
  }

  return <ProductForm initialData={product} isEdit={true} />;
}
