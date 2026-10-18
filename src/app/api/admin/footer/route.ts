import { NextRequest, NextResponse } from 'next/server';
import { getFooterData, saveFooterData } from '@/lib/footer';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getFooterData();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching admin footer data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch footer data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json();
    const updated = await saveFooterData(body);

    return NextResponse.json({
      success: true,
      message: 'Footer content and navigation updated and published successfully!',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error saving footer data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save footer data' },
      { status: 500 }
    );
  }
}
