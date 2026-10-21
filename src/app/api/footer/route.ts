import { NextResponse } from 'next/server';
import { getFooterData } from '@/lib/footer';

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getFooterData();
    return NextResponse.json({ success: true, data }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch footer data' },
      { status: 500 }
    );
  }
}
