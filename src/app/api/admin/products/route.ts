import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;
    const products = await prisma.product.findMany({
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Admin get products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;
    const body = await request.json();
    const {
      name,
      slug,
      sku,
      shortDescription,
      fullDescription,
      regularPrice,
      salePrice,
      costPrice,
      stockQuantity = 100,
      lowStockThreshold = 10,
      categoryId,
      isFeatured = false,
      isBestSeller = false,
      isNew = false,
      hasTimer = false,
      active = true,
      benefits,
      howToUse,
      seoTitle,
      seoDescription,
      images = [],
    } = body;

    if (!name || !slug || !regularPrice) {
      return NextResponse.json({ error: 'Name, slug and regular price are required' }, { status: 400 });
    }

    const created = await prisma.product.create({
      data: {
        name,
        slug: slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        sku: sku || `HERB-${Math.floor(1000 + Math.random() * 9000)}`,
        shortDescription,
        fullDescription,
        regularPrice: Number(regularPrice),
        salePrice: salePrice ? Number(salePrice) : null,
        costPrice: costPrice ? Number(costPrice) : null,
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
        categoryId: categoryId || null,
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        isNew: Boolean(isNew),
        isOnSale: Boolean(salePrice && salePrice < regularPrice),
        hasTimer: Boolean(hasTimer),
        active: Boolean(active),
        benefits: typeof benefits === 'string' ? benefits : JSON.stringify(benefits || []),
        howToUse,
        seoTitle,
        seoDescription,
        images: {
          create: images.map((img: string, idx: number) => ({
            url: img,
            alt: `${name} - Image ${idx + 1}`,
            displayOrder: idx,
            isThumbnail: idx === 0,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ success: true, product: created });
  } catch (error) {
    console.error('Admin create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Admin update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
