import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rateLimit';

// Hair care & Ayurvedic synonym dictionary for intuitive search expansion
const SYNONYMS: Record<string, string[]> = {
  trio: ['kit', 'complete', 'comb', 'shampoo'],
  massager: ['comb', 'wooden', 'scalp'],
  biotin: ['oil', 'shampoo'],
  dandruff: ['neem', 'oil', 'shampoo'],
  growth: ['oil', 'hair oil', '21 herbs'],
  regrowth: ['oil', 'hair oil'],
  fall: ['anti hair fall', 'hair oil'],
  hairfall: ['anti hair fall', 'hair oil'],
  combo: ['combos', 'kit', 'pack'],
  combos: ['combo', 'kit', 'pack'],
  kit: ['combos', 'complete', 'combo'],
  kits: ['combos', 'complete', 'combo'],
};

export async function GET(request: NextRequest) {
  try {
    // Rate limit: max 60 search queries per minute per IP
    const rateLimitError = enforceRateLimit(request, 'product_search', 60, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const rawQ = (request.nextUrl.searchParams.get('q')?.trim() || '').slice(0, 100);

    if (!rawQ || rawQ.length < 1) {
      return NextResponse.json({ products: [] });
    }

    const q = rawQ.toLowerCase();
    const rawWords = q.split(/\s+/).filter((w) => w.length > 0);

    // Expand search keywords with domain synonyms
    const searchTerms = new Set<string>([q, ...rawWords]);
    for (const w of rawWords) {
      if (SYNONYMS[w]) {
        SYNONYMS[w].forEach((syn) => searchTerms.add(syn));
      }
    }
    const termsList = Array.from(searchTerms);

    // Build comprehensive case-insensitive Prisma search conditions
    const orConditions: any[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { shortDescription: { contains: q, mode: 'insensitive' } },
      { fullDescription: { contains: q, mode: 'insensitive' } },
      { benefits: { contains: q, mode: 'insensitive' } },
      { seoTitle: { contains: q, mode: 'insensitive' } },
      { seoDescription: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
      { category: { slug: { contains: q, mode: 'insensitive' } } },
    ];

    for (const term of termsList) {
      orConditions.push(
        { name: { contains: term, mode: 'insensitive' } },
        { shortDescription: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
        { category: { name: { contains: term, mode: 'insensitive' } } }
      );
    }

    // Query active products matching any relevant field
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: orConditions,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        salePrice: true,
        regularPrice: true,
        rating: true,
        reviewCount: true,
        category: {
          select: { name: true, slug: true },
        },
        images: {
          take: 1,
          orderBy: { displayOrder: 'asc' },
          select: { url: true },
        },
      },
    });

    // Intelligent relevance ranking:
    // 1. Exact match on name / slug (score +100)
    // 2. Name starts with query (score +50)
    // 3. Name contains full query (score +30)
    // 4. Token matches in name (score +15 per word)
    // 5. Category matches query (score +20)
    // 6. Rating boost (+rating * 2)
    const scored = products.map((p) => {
      let score = 0;
      const nameLower = p.name.toLowerCase();
      const slugLower = p.slug.toLowerCase();
      const catLower = p.category?.name.toLowerCase() || '';

      if (nameLower === q || slugLower === q) score += 100;
      else if (nameLower.startsWith(q)) score += 50;
      else if (nameLower.includes(q)) score += 30;

      for (const w of rawWords) {
        if (nameLower.includes(w)) score += 15;
        if (catLower.includes(w)) score += 10;
      }

      score += (p.rating || 4.5) * 2;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice || p.regularPrice,
        rating: p.rating,
        reviewCount: p.reviewCount,
        categoryName: p.category?.name || 'Ayurveda',
        images: p.images,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    // Return top 8 best matching products
    return NextResponse.json({
      products: scored.slice(0, 8),
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ products: [] });
  }
}
