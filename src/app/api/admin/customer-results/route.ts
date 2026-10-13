import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const results = await prisma.customerResult.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer results' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { customerName, productTitle, beforeImage, afterImage, caption } = body;
    if (!customerName || !afterImage) {
      return NextResponse.json({ error: 'Customer name and after image required' }, { status: 400 });
    }

    const created = await prisma.customerResult.create({
      data: {
        customerName: String(customerName).trim().slice(0, 100),
        productTitle: productTitle ? String(productTitle).trim().slice(0, 200) : null,
        beforeImage: beforeImage ? String(beforeImage).trim() : null,
        afterImage: String(afterImage).trim(),
        caption: caption ? String(caption).trim().slice(0, 500) : null,
      },
    });

    return NextResponse.json({ success: true, result: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create result' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await request.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }
    await prisma.customerResult.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
  }
}
