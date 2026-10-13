import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));

    const where: any = { isApproved: true };
    if (productId) {
      where.productId = productId;
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    const totalCount = await prisma.review.count({ where });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 5.0;

    return NextResponse.json({
      reviews,
      totalCount,
      averageRating: Number(avgRating.toFixed(1)),
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 reviews per minute per IP
    const rateLimitError = enforceRateLimit(request, 'review_submission', 5, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => ({}));
    const { productId, customerName, customerEmail, rating, title, content } = body;

    if (!productId || !customerName || !rating || !content) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    const numRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const cleanName = String(customerName).trim().slice(0, 100);
    const cleanContent = String(content).trim().slice(0, 2000);
    const cleanTitle = title ? String(title).trim().slice(0, 150) : null;
    const cleanEmail = customerEmail ? String(customerEmail).trim().toLowerCase().slice(0, 100) : null;

    if (cleanName.length < 2) {
      return NextResponse.json({ error: 'Reviewer name must be at least 2 characters' }, { status: 400 });
    }

    if (cleanContent.length < 3) {
      return NextResponse.json({ error: 'Review comment must be at least 3 characters' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerName: cleanName,
        customerEmail: cleanEmail,
        rating: numRating,
        title: cleanTitle,
        content: cleanContent,
        isVerifiedPurchase: false,
        isApproved: true,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
