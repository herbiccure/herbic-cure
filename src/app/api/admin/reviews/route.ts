import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const reviews = await prisma.review.findMany({
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));

    // Batch update: set exact list of featured reviews
    if (Array.isArray(body.featuredIds)) {
      await prisma.review.updateMany({
        where: { id: { in: body.featuredIds } },
        data: { isFeatured: true, isApproved: true },
      });
      await prisma.review.updateMany({
        where: { id: { notIn: body.featuredIds } },
        data: { isFeatured: false },
      });
      const reviews = await prisma.review.findMany({
        include: { product: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, reviews });
    }

    const { id, isApproved, isFeatured, isVerifiedPurchase } = body;
    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        isApproved: isApproved !== undefined ? Boolean(isApproved) : undefined,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        isVerifiedPurchase: isVerifiedPurchase !== undefined ? Boolean(isVerifiedPurchase) : undefined,
      },
      include: { product: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const {
      productId,
      customerName,
      customerEmail,
      rating = 5,
      title,
      content,
      isVerifiedPurchase = true,
      isApproved = true,
      isFeatured = false,
    } = body;

    if (!productId || !customerName || !content) {
      return NextResponse.json(
        { error: 'Product, customer name, and review content are required' },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerName: customerName.trim(),
        customerEmail: customerEmail ? customerEmail.trim() : null,
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        title: title ? title.trim() : null,
        content: content.trim(),
        isVerifiedPurchase: Boolean(isVerifiedPurchase),
        isApproved: Boolean(isApproved),
        isFeatured: Boolean(isFeatured),
      },
      include: { product: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Failed to create review:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create review' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await request.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
