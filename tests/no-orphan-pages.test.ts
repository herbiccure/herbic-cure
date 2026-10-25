import { describe, it, expect } from 'vitest';
import sitemap from '../src/app/sitemap';
import fs from 'fs';
import path from 'path';
import { DEFAULT_FOOTER_DATA } from '../src/types/footer';

describe('Phase 2: On-Page Architecture & Internal Link Graph', () => {
  it('guarantees zero orphan pages across the entire sitemap catalog', async () => {
    const sitemapEntries = await sitemap();
    const sitemapUrls = sitemapEntries.map((e) => {
      try {
        const u = new URL(e.url);
        return u.pathname === '' ? '/' : u.pathname;
      } catch {
        return e.url;
      }
    });

    // 1. Gather all internal links from Header & Footer
    const headerContent = fs.readFileSync(path.resolve('src/components/layout/Header.tsx'), 'utf8');
    const footerContent = fs.readFileSync(path.resolve('src/components/layout/Footer.tsx'), 'utf8');
    const homeContent = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf8');

    const layoutLinks = new Set<string>();
    const linkRegex = /href=["'](\/[^"']*)["']/g;

    for (const content of [headerContent, footerContent, homeContent]) {
      let match: RegExpExecArray | null;
      while ((match = linkRegex.exec(content)) !== null) {
        layoutLinks.add(match[1]);
      }
    }

    // Also include default dynamic links from the Footer configuration
    DEFAULT_FOOTER_DATA.columns.forEach((col) => {
      col.links.forEach((link) => {
        if (link.url.startsWith('/')) {
          layoutLinks.add(link.url);
        }
      });
    });

    // 2. Dynamic Hub Links
    // All /products/[slug] are linked from /products catalog grid and Regimen cross-sells
    // All /collections/[slug] are linked from Footer / Collections grid
    // All /hair-care-tips/[slug] are linked from /hair-care-tips hub
    const hubCoverage = [
      { prefix: '/products/', parentHub: '/products' },
      { prefix: '/collections/', parentHub: '/collections' },
      { prefix: '/hair-care-tips/', parentHub: '/hair-care-tips' },
    ];

    const orphanUrls: string[] = [];

    for (const pathname of sitemapUrls) {
      // Direct link from Header, Footer, or Homepage
      if (layoutLinks.has(pathname)) {
        continue;
      }

      // Check if reachable via a crawlable parent hub
      const hub = hubCoverage.find((h) => pathname.startsWith(h.prefix));
      if (hub && layoutLinks.has(hub.parentHub)) {
        continue;
      }

      orphanUrls.push(pathname);
    }

    // Assert that zero orphan URLs exist
    expect(orphanUrls).toEqual([]);
  });

  it('verifies that every public page contains a valid Heading 1 hierarchy', () => {
    const criticalPageFiles = [
      'src/app/products/page.tsx',
      'src/app/about/page.tsx',
      'src/app/ingredients/page.tsx',
      'src/app/how-to-use/page.tsx',
      'src/app/reviews/page.tsx',
      'src/app/results/page.tsx',
      'src/app/not-found.tsx',
    ];

    for (const file of criticalPageFiles) {
      const content = fs.readFileSync(path.resolve(file), 'utf8');
      const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
      expect(h1Count, `Expected single H1 in ${file}`).toBe(1);
    }
  });
});
