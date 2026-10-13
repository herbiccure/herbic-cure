import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const checkEligibility = searchParams.get('eligibility') === 'true';

    // Eligibility check for logged in user
    if (checkEligibility && productId) {
      const session = await getServerSession();
      if (!session?.user?.id) {
        return NextResponse.json({
          isLoggedIn: false,
          hasPurchased: false,
          alreadyReviewed: false,
        });
      }

      const userEmail = session.user.email?.toLowerCase().trim();

      // Check if user purchased this product
      const purchaseOrder = await prisma.order.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            ...(userEmail ? [{ customerEmail: userEmail }] : []),
          ],
          orderStatus: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          items: {
            some: { productId },
          },
        },
      });

      // Check if already reviewed
      const existingReview = await prisma.review.findFirst({
        where: {
          productId,
          OR: [
            { userId: session.user.id },
            ...(userEmail ? [{ customerEmail: userEmail }] : []),
          ],
        },
      });

      return NextResponse.json({
        isLoggedIn: true,
        hasPurchased: !!purchaseOrder,
        alreadyReviewed: !!existingReview,
        userName: session.user.name || 'Valued Customer',
      });
    }

    if (!productId) {
      // Return recent approved reviews across catalog
      const reviews = await prisma.review.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({ reviews });
    }

    // Specific product reviews
    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = reviews.length;
    const averageRating =
      totalCount > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1))
        : 5.0;

    const distribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return NextResponse.json({
      reviews,
      stats: {
        totalCount,
        averageRating,
        distribution,
      },
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Mandatory Authentication Check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Authentication Required: Please sign in to your Herbic Cure account to leave a product review.',
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { productId, rating, title, content } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Valid Product ID is required.' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Please provide a star rating between 1 and 5.' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please write a review with at least 5 characters.' },
        { status: 400 }
      );
    }

    // Verify Product exists in database
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found in catalog.' }, { status: 404 });
    }

    const userEmail = session.user.email?.toLowerCase().trim();
    const userId = session.user.id;

    // 2. Mandatory Verified Purchase Check
    // The review will be published ONLY when they have purchased that product
    const purchaseOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { userId },
          ...(userEmail ? [{ customerEmail: userEmail }] : []),
        ],
        orderStatus: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        items: {
          some: { productId },
        },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          error: 'Verified Purchase Required: Only customers who have purchased this formulation can publish a review. We could not find a confirmed order for this product under your account.',
          requiresPurchase: true,
        },
        { status: 403 }
      );
    }

    // 3. Create or update verified review
    // Published immediately because purchase has been confirmed against order history
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        OR: [
          { userId },
          ...(userEmail ? [{ customerEmail: userEmail }] : []),
        ],
      },
    });

    let review;
    if (existingReview) {
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: numericRating,
          title: title?.trim() || null,
          content: content.trim(),
          isVerifiedPurchase: true,
          isApproved: true,
        },
      });
    } else {
      review = await prisma.review.create({
        data: {
          productId,
          userId,
          customerName: session.user.name || 'Verified Customer',
          customerEmail: userEmail,
          rating: numericRating,
          title: title?.trim() || null,
          content: content.trim(),
          isVerifiedPurchase: true,
          isApproved: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your verified review has been published.',
      review,
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
