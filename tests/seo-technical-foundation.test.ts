import { describe, it, expect, beforeEach } from 'vitest';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';
import { getRedirect, createOrUpdateRedirect, recordSlugChange } from '../src/lib/redirects';
import prisma from '../src/lib/prisma';
import { proxy } from '../src/proxy';
import { NextRequest } from 'next/server';

describe('Phase 1: Technical SEO Foundation', () => {
  describe('robots.ts specification', () => {
    it('disallows private, administrative, cart, and checkout paths', () => {
      const robotsConfig = robots();
      expect(robotsConfig).toBeDefined();

      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
      expect(rules).toBeDefined();
      expect(rules.allow).toBe('/');

      const disallowList = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];
      expect(disallowList).toContain('/admin');
      expect(disallowList).toContain('/cart');
      expect(disallowList).toContain('/checkout');
      expect(disallowList).toContain('/api');
      expect(disallowList).toContain('/order-success');
    });

    it('references the absolute canonical XML sitemap', () => {
      const robotsConfig = robots();
      expect(robotsConfig.sitemap).toMatch(/https?:\/\/.+\/sitemap\.xml/);
    });
  });

  describe('sitemap.ts dynamic generation', () => {
    it('generates an indexable sitemap containing only canonical public URLs', async () => {
      const entries = await sitemap();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(10);

      const urls = entries.map((e) => e.url);

      // Verify essential public routes are present
      expect(urls.some((u) => u.endsWith('/'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/products'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/collections'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/ingredients'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/how-to-use'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/about'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/shipping-policy'))).toBe(true);

      // Verify dynamic catalog products are present
      expect(urls.some((u) => u.includes('/products/herbic-cure-21-herbs-fusion-hair-oil-q1'))).toBe(true);

      // Verify private paths are NEVER included
      expect(urls.some((u) => u.includes('/admin'))).toBe(false);
      expect(urls.some((u) => u.includes('/cart'))).toBe(false);
      expect(urls.some((u) => u.includes('/checkout'))).toBe(false);
      expect(urls.some((u) => u.includes('/api/'))).toBe(false);
      expect(urls.some((u) => u.includes('/order-success'))).toBe(false);

      // Verify each entry has valid lastModified and priority
      for (const entry of entries) {
        expect(entry.url).toMatch(/^https?:\/\//);
        expect(entry.lastModified).toBeInstanceOf(Date);
        expect(entry.priority).toBeGreaterThanOrEqual(0.1);
        expect(entry.priority).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('Redirect Engine & Slug History', () => {
    beforeEach(async () => {
      await prisma.redirect.deleteMany();
    });

    it('creates and looks up a 301 permanent redirect', async () => {
      await createOrUpdateRedirect('/products/old-oil-slug', '/products/new-oil-slug', 301);

      const lookup = await getRedirect('/products/old-oil-slug');
      expect(lookup).toBeDefined();
      expect(lookup?.destination).toBe('/products/new-oil-slug');
      expect(lookup?.statusCode).toBe(301);
    });

    it('prevents self-referencing redirect loops', async () => {
      await createOrUpdateRedirect('/products/same-slug', '/products/same-slug', 301);

      const lookup = await getRedirect('/products/same-slug');
      expect(lookup).toBeNull();
    });

    it('flattens redirect chains to prevent multi-hop redirects', async () => {
      // /a -> /b
      await createOrUpdateRedirect('/products/step-a', '/products/step-b', 301);
      // /b -> /c (should update /a -> /c automatically!)
      await createOrUpdateRedirect('/products/step-b', '/products/step-c', 301);

      const redirectA = await getRedirect('/products/step-a');
      const redirectB = await getRedirect('/products/step-b');

      expect(redirectA?.destination).toBe('/products/step-c');
      expect(redirectB?.destination).toBe('/products/step-c');
    });

    it('records slug history change via helper', async () => {
      await recordSlugChange('herbic-oil-v1', 'herbic-oil-v2', '/products');

      const lookup = await getRedirect('/products/herbic-oil-v1');
      expect(lookup?.destination).toBe('/products/herbic-oil-v2');
      expect(lookup?.statusCode).toBe(301);
    });
  });

  describe('Edge Proxy (proxy.ts)', () => {
    it('sets X-Robots-Tag: noindex, nofollow, noarchive on cart and checkout', () => {
      const cartReq = new NextRequest('http://localhost:3000/cart');
      const cartRes = proxy(cartReq);
      expect(cartRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive');
      expect(cartRes.headers.get('Cache-Control')).toContain('private, no-cache');

      const checkoutReq = new NextRequest('http://localhost:3000/checkout');
      const checkoutRes = proxy(checkoutReq);
      expect(checkoutRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive');
    });

    it('normalizes trailing slashes to prevent duplicate content (301 redirect)', () => {
      const trailingSlashReq = new NextRequest('http://localhost:3000/products/');
      const response = proxy(trailingSlashReq);

      expect(response.status).toBe(301);
      expect(response.headers.get('Location')).toBe('http://localhost:3000/products');
    });
  });
});
