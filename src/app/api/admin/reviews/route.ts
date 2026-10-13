import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

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
