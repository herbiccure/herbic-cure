import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const categories = await prisma.category.findMany({
      include: { products: { select: { id: true } } },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { name, slug, description, image, active = true } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
    }

    const created = await prisma.category.create({
      data: {
        name: String(name).trim().slice(0, 100),
        slug: String(slug).toLowerCase().trim().slice(0, 100),
        description: description ? String(description).trim().slice(0, 500) : null,
        image: image ? String(image).trim() : null,
        active: Boolean(active),
      },
    });

    return NextResponse.json({ success: true, category: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await request.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { id, name, slug, description, image, active, displayOrder, reorder } = body;

    // Handle batch reorder
    if (Array.isArray(reorder)) {
      const updates = reorder.map((catId: string, idx: number) =>
        prisma.category.update({
          where: { id: catId },
          data: { displayOrder: idx },
        })
      );
      await prisma.$transaction(updates);
      return NextResponse.json({ success: true, count: reorder.length });
    }

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (slug !== undefined) updateData.slug = String(slug).toLowerCase().trim();
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (image !== undefined) updateData.image = image ? String(image).trim() : null;
    if (active !== undefined) updateData.active = Boolean(active);
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}
