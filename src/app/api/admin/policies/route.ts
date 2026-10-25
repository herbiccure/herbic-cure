import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getPolicyData, savePolicyData, DEFAULT_POLICIES } from '@/lib/policies';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const policy = await getPolicyData(slug);
      return NextResponse.json({ success: true, policy });
    }

    // Return all supported policies
    const slugs = Object.keys(DEFAULT_POLICIES);
    const policies = await Promise.all(slugs.map((s) => getPolicyData(s)));

    return NextResponse.json({ success: true, policies });
  } catch (error: any) {
    logger.error('admin.policies.fetch_failed', { error });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json();
    const { slug, title, subtitle, badge, lastUpdated, content } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Policy slug is required' },
        { status: 400 }
      );
    }

    const updated = await savePolicyData(slug, {
      title,
      subtitle,
      badge,
      lastUpdated,
      content,
    });

    return NextResponse.json({
      success: true,
      message: 'Policy successfully updated and published to storefront.',
      policy: updated,
    });
  } catch (error: any) {
    logger.error('admin.policies.save_failed', { error });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save policy' },
      { status: 500 }
    );
  }
}
