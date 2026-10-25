import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getAboutPageData, saveAboutPageData } from '@/lib/about';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAboutPageData();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error('admin.about.fetch_failed', { error });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch about page data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json();
    const updated = await saveAboutPageData(body);

    return NextResponse.json({
      success: true,
      message: 'About Us page content successfully updated and published to storefront.',
      data: updated,
    });
  } catch (error: any) {
    logger.error('admin.about.save_failed', { error });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save about page content' },
      { status: 500 }
    );
  }
}
