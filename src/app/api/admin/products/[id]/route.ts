import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { normalizeImageUrl } from '@/lib/utils';
import { invalidateProductCache, invalidateHomepageCache } from '@/lib/cache/invalidator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Admin get product error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription;
    if (body.fullDescription !== undefined) updateData.fullDescription = body.fullDescription;
    if (body.regularPrice !== undefined) updateData.regularPrice = Number(body.regularPrice);
    if (body.salePrice !== undefined) {
      updateData.salePrice = body.salePrice ? Number(body.salePrice) : null;
      if (body.isOnSale === undefined) {
        updateData.isOnSale = Boolean(updateData.salePrice && (body.regularPrice !== undefined ? updateData.salePrice < Number(body.regularPrice) : true));
      }
    }
    if (body.isOnSale !== undefined) updateData.isOnSale = Boolean(body.isOnSale);
    if (body.hasTimer !== undefined) updateData.hasTimer = Boolean(body.hasTimer);
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice ? Number(body.costPrice) : null;
    if (body.stockQuantity !== undefined) updateData.stockQuantity = Number(body.stockQuantity);
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(body.lowStockThreshold);
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null;
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
    if (body.isBestSeller !== undefined) updateData.isBestSeller = Boolean(body.isBestSeller);
    if (body.isNew !== undefined) updateData.isNew = Boolean(body.isNew);
    if (body.active !== undefined) updateData.active = Boolean(body.active);
    if (body.benefits !== undefined) updateData.benefits = typeof body.benefits === 'string' ? body.benefits : JSON.stringify(body.benefits || []);
    if (body.howToUse !== undefined) updateData.howToUse = body.howToUse;
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // If new images provided, recreate
    if (Array.isArray(body.images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      for (let i = 0; i < body.images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: id,
            url: normalizeImageUrl(body.images[i]),
            displayOrder: i,
            isThumbnail: i === 0,
          },
        });
      }
    }

    invalidateProductCache(updated.slug);
    invalidateHomepageCache();
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Admin update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    invalidateProductCache();
    invalidateHomepageCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
