import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const ingredients = await prisma.ingredient.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ ingredients });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { name, slug, shortDescription, fullDescription, benefits } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
    }

    const count = await prisma.ingredient.count();
    const created = await prisma.ingredient.create({
      data: {
        name: String(name).trim().slice(0, 100),
        slug: String(slug).toLowerCase().trim().slice(0, 100),
        shortDescription: shortDescription ? String(shortDescription).trim().slice(0, 500) : null,
        fullDescription: fullDescription ? String(fullDescription).trim() : null,
        benefits: typeof benefits === 'string' ? benefits : JSON.stringify(benefits || []),
        displayOrder: count + 1,
      },
    });

    return NextResponse.json({ success: true, ingredient: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await request.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 });
    }
    await prisma.ingredient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 });
  }
}
