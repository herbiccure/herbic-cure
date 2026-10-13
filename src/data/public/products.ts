import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Public Products Cached DAL with Next.js Cache Tags
 */
export const getCachedPublicProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { active: true },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
  },
  ['public-products-all'],
  { tags: ['products'], revalidate: 3600 }
);

export const getCachedProductBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      return prisma.product.findUnique({
        where: { slug },
        include: {
          images: { orderBy: { displayOrder: 'asc' } },
          category: true,
          ingredients: { include: { ingredient: true } },
          reviews: { where: { isApproved: true }, orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
    },
    [`public-product-${slug}`],
    { tags: ['products', `product-${slug}`], revalidate: 3600 }
  )();

export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
    });
  },
  ['public-categories-all'],
  { tags: ['categories'], revalidate: 3600 }
);
