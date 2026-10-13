import type { MetadataRoute } from 'next';

/**
 * Technical SEO Robots.txt Specification
 * Strictly disallows search crawlers from private, transactional, and administrative areas.
 * Disallows query parameter faceted combinations that cause crawl waste.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.herbiccure.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
          '/account',
          '/account/*',
          '/cart',
          '/checkout',
          '/order-success',
          '/track-order',
          '/*?*sort=*',
          '/*?*filter=*',
          '/*?*utm_*',
          '/*?*ref=*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
