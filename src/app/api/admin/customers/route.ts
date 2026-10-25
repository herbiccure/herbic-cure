import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          select: { id: true, total: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ customers });
  } catch (error) {
    logger.error('admin.customers.fetch_failed', { error });
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
