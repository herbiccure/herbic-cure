import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Rate Limiting: max 15 coupon code verification queries per minute per IP
    const rateLimitError = enforceRateLimit(request, 'coupon_verify', 15, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim().toUpperCase();
    const cartTotal = Number(searchParams.get('cartTotal')) || 0;

    if (!code || code.length > 50) {
      return NextResponse.json({ error: 'Valid coupon code is required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: 'Invalid or inactive promotional coupon code' }, { status: 404 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon usage limit has been reached' }, { status: 400 });
    }

    if (cartTotal > 0 && coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return NextResponse.json(
        { error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon` },
        { status: 400 }
      );
    }

    let calculatedDiscount = 0;
    if (cartTotal > 0) {
      if (coupon.discountType === 'PERCENTAGE') {
        calculatedDiscount = Math.round((cartTotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
          calculatedDiscount = coupon.maxDiscount;
        }
      } else {
        calculatedDiscount = Math.min(coupon.discountValue, cartTotal);
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue || 0,
        maxDiscount: coupon.maxDiscount || null,
        calculatedDiscount,
      },
    });
  } catch (error) {
    logger.error('coupon.verify_failed', { error });
    return NextResponse.json({ error: 'Server error verifying coupon' }, { status: 500 });
  }
}
