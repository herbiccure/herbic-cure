import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: max 30 search queries per minute per IP
    const rateLimitError = enforceRateLimit(request, 'product_search', 30, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const q = (request.nextUrl.searchParams.get('q')?.trim() || '').slice(0, 100);

    if (!q || q.length < 2) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q } },
          { shortDescription: { contains: q } },
          { benefits: { contains: q } },
        ],
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        salePrice: true,
        regularPrice: true,
        images: {
          take: 1,
          orderBy: { displayOrder: 'asc' },
          select: { url: true },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ products: [] });
  }
}
