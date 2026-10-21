import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { invalidateAllPublicCaches } from '@/lib/cache/invalidator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const settings = await prisma.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    if (!map.footer_logo && map.footer_settings) {
      try {
        const parsed = JSON.parse(map.footer_settings);
        if (parsed?.brand?.logoUrl) {
          map.footer_logo = parsed.brand.logoUrl;
        }
      } catch {}
    }

    return NextResponse.json({ settings: map });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));

    for (const [key, value] of Object.entries(body)) {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: valStr },
        create: { key, value: valStr },
      });
    }

    // If footer_logo is provided in settings, synchronize into footer_settings brand.logoUrl
    if (body.footer_logo && typeof body.footer_logo === 'string') {
      try {
        const { getFooterData, saveFooterData, clearFooterCache } = await import('@/lib/footer');
        await saveFooterData({
          brand: {
            logoUrl: body.footer_logo,
            brandName: body.brand_name || undefined as any,
            tagline: undefined as any,
            description: undefined as any,
          },
        });
        clearFooterCache();
      } catch (err) {
        console.error('Failed to sync footer_logo with footer_settings:', err);
      }
    }

    invalidateAllPublicCaches();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
