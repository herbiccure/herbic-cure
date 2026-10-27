import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { invalidateAllPublicCaches } from '@/lib/cache/invalidator';
import { createAuditLogEntry } from '@/data/admin/audit';
import { codAdvanceSettingsSchema } from '@/lib/schemas/settings';

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
    const roleUpper = (authCheck.session.role || '').toUpperCase();

    // Check if COD Advance or Shipping Mode settings are being modified
    const codAdvanceKeys = [
      'shipping_mode',
      'cod_advance_enabled',
      'cod_advance_type',
      'cod_advance_value',
      'cod_advance_max_cap',
      'cod_advance_message',
    ];
    const isTouchingCodAdvance = codAdvanceKeys.some((k) => k in body);

    if (isTouchingCodAdvance) {
      // Rule: Only highest admin role (OWNER / SUPER_ADMIN) can change COD advance settings
      if (!['OWNER', 'SUPER_ADMIN'].includes(roleUpper)) {
        return NextResponse.json(
          { error: 'Forbidden: Only the store OWNER or SUPER_ADMIN can modify COD advance settings' },
          { status: 403 }
        );
      }

      // Strict Zod Validation
      const parsedCodAdvance = codAdvanceSettingsSchema.safeParse(body);
      if (!parsedCodAdvance.success) {
        return NextResponse.json(
          { error: parsedCodAdvance.error.issues[0]?.message || 'Invalid COD advance settings' },
          { status: 400 }
        );
      }
    }

    // Capture previous values for audit trail
    const keysToUpdate = Object.keys(body);
    const existingSettings = await prisma.siteSetting.findMany({
      where: { key: { in: keysToUpdate } },
    });
    const previousMap: Record<string, string> = {};
    for (const s of existingSettings) {
      previousMap[s.key] = s.value;
    }

    // Apply updates
    for (const [key, value] of Object.entries(body)) {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: valStr },
        create: { key, value: valStr },
      });
    }

    // Record structured audit trail entry
    await createAuditLogEntry({
      actorId: authCheck.session.id,
      actorEmail: authCheck.session.email,
      actorRole: authCheck.session.role,
      action: isTouchingCodAdvance ? 'COD_ADVANCE_SETTINGS_UPDATED' : 'SETTING_UPDATE',
      resource: 'SiteSetting',
      resourceId: isTouchingCodAdvance ? 'shipping_fulfillment' : 'store_settings',
      diffJson: JSON.stringify({
        previous: previousMap,
        updated: body,
      }),
    });

    // If footer_logo is provided in settings, synchronize into footer_settings brand.logoUrl
    if (body.footer_logo && typeof body.footer_logo === 'string') {
      try {
        const { saveFooterData, clearFooterCache } = await import('@/lib/footer');
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
        logger.warn('admin.settings.footer_logo_sync_failed', { error: (err as any)?.message });
      }
    }

    invalidateAllPublicCaches();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('admin.settings.update_failed', { error });
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
