import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { invalidateAllPublicCaches } from '@/lib/cache/invalidator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    invalidateAllPublicCaches();

    return NextResponse.json({
      success: true,
      message: 'Website cache purged successfully. Changes are now live on storefront.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to revalidate cache' },
      { status: 500 }
    );
  }
}
