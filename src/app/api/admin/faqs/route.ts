import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const faqs = await prisma.fAQ.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch faqs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { question, answer, category = 'GENERAL', placement = 'HOMEPAGE', active = true, displayOrder = 0 } = body;
    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer required' }, { status: 400 });
    }

    const created = await prisma.fAQ.create({
      data: {
        question: String(question).trim(),
        answer: String(answer).trim(),
        category: String(category).trim(),
        placement: String(placement).trim(),
        active: Boolean(active),
        displayOrder: Number(displayOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, faq: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create faq' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { id, question, answer, category, placement, active, displayOrder } = body;
    if (!id) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (question !== undefined) updateData.question = String(question).trim();
    if (answer !== undefined) updateData.answer = String(answer).trim();
    if (category !== undefined) updateData.category = String(category).trim();
    if (placement !== undefined) updateData.placement = String(placement).trim();
    if (active !== undefined) updateData.active = Boolean(active);
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);

    const updated = await prisma.fAQ.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, faq: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update faq' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await request.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }
    await prisma.fAQ.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete faq' }, { status: 500 });
  }
}
