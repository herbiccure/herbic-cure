import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ submissions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contact submissions' }, { status: 500 });
  }
}
