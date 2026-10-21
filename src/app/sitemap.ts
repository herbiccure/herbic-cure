import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const revalidate = 3600; // Cache sitemap for 1 hour, or revalidate on catalog changes

/**
 * Technical SEO XML Sitemap Specification
 * Dynamically aggregates all 200 OK indexable canonical URLs.
 * Strictly excludes /admin, /account, /cart, /checkout, and private API routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.herbiccure.com';
  const now = new Date();

  // 1. Static Core Public Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hair-care-tips`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ingredients`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-to-use`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/results`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    // 2. Dynamic Published Products
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    // 3. Dynamic Product Categories
    const categories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    });

    const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/collections/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 4. Dynamic Published Blog Posts / Guides
    const blogPosts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    const blogEntries: MetadataRoute.Sitemap = blogPosts.map((b) => ({
      url: `${baseUrl}/hair-care-tips/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

    return [...staticPages, ...productEntries, ...categoryEntries, ...blogEntries];
  } catch (error) {
    console.warn('Deferred sitemap database query:', (error as any)?.message || String(error));
    return staticPages;
  }
}
