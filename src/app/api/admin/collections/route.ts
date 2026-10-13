import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const collections = await prisma.collection.findMany({
      include: { products: { select: { productId: true } } },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ collections });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { name, slug, description, image, bannerImage } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
    }

    const created = await prisma.collection.create({
      data: {
        name: String(name).trim().slice(0, 100),
        slug: String(slug).toLowerCase().trim().slice(0, 100),
        description: description ? String(description).trim().slice(0, 500) : null,
        image: image ? String(image).trim() : null,
        bannerImage: bannerImage ? String(bannerImage).trim() : null,
      },
    });

    return NextResponse.json({ success: true, collection: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await request.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }
    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
