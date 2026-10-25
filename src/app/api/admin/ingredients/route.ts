import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

// GET: List all ingredients sorted by displayOrder
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const ingredients = await prisma.ingredient.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      ingredients,
      count: ingredients.length,
    });
  } catch (error) {
    logger.error('admin.ingredients.fetch_failed', { error });
    return NextResponse.json(
      { error: 'Failed to fetch ingredients' },
      { status: 500 }
    );
  }
}

// POST: Create a new ingredient or reorder bulk
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));

    // Check for bulk reorder action
    if (body.action === 'reorder' && Array.isArray(body.items)) {
      const updates = body.items.map((item: { id: string; displayOrder: number }) =>
        prisma.ingredient.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      );
      await prisma.$transaction(updates);
      return NextResponse.json({ success: true, message: 'Reordered successfully' });
    }

    const {
      name,
      slug,
      image,
      shortDescription,
      fullDescription,
      benefits,
      displayOrder,
      active = true,
    } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Ingredient name is required' },
        { status: 400 }
      );
    }

    const generatedSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const existing = await prisma.ingredient.findUnique({
      where: { slug: generatedSlug },
    });
    const finalSlug = existing ? `${generatedSlug}-${Date.now()}` : generatedSlug;

    // Get max order if not provided
    let order = typeof displayOrder === 'number' ? displayOrder : 0;
    if (displayOrder === undefined || displayOrder === null) {
      const maxOrder = await prisma.ingredient.aggregate({
        _max: { displayOrder: true },
      });
      order = (maxOrder._max.displayOrder || 0) + 1;
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        image: image || null,
        shortDescription: shortDescription?.trim() || null,
        fullDescription: fullDescription?.trim() || null,
        benefits: benefits?.trim() || null,
        displayOrder: order,
        active: Boolean(active),
      },
    });

    return NextResponse.json({ success: true, ingredient }, { status: 201 });
  } catch (error) {
    logger.error('admin.ingredients.create_failed', { error });
    return NextResponse.json(
      { error: 'Failed to create ingredient' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing ingredient
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const {
      id,
      name,
      slug,
      image,
      shortDescription,
      fullDescription,
      benefits,
      displayOrder,
      active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Ingredient ID is required' },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (slug !== undefined) dataToUpdate.slug = slug.trim();
    if (image !== undefined) dataToUpdate.image = image || null;
    if (shortDescription !== undefined)
      dataToUpdate.shortDescription = shortDescription?.trim() || null;
    if (fullDescription !== undefined)
      dataToUpdate.fullDescription = fullDescription?.trim() || null;
    if (benefits !== undefined) dataToUpdate.benefits = benefits?.trim() || null;
    if (displayOrder !== undefined)
      dataToUpdate.displayOrder = Number(displayOrder);
    if (active !== undefined) dataToUpdate.active = Boolean(active);

    const updated = await prisma.ingredient.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, ingredient: updated });
  } catch (error) {
    logger.error('admin.ingredients.update_failed', { error });
    return NextResponse.json(
      { error: 'Failed to update ingredient' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an ingredient
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ingredient ID is required' },
        { status: 400 }
      );
    }

    await prisma.ingredient.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (error) {
    logger.error('admin.ingredients.delete_failed', { error });
    return NextResponse.json(
      { error: 'Failed to delete ingredient' },
      { status: 500 }
    );
  }
}
