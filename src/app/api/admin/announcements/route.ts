import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'announcements',
            'announcement_bar_enabled',
            'announcement_bar_speed',
            'announcement_bar_mode',
            'announcement_bar_bg',
            'announcement_bar_text_color',
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    let announcements: string[] = [
      "Experience the power of South India's best natural Hair Oils",
      "Handcrafted with 21 Himalayan Herbs & Authentic Kshirapak Vidhi — 100% Pure & Toxin-Free",
      "Free Express Shipping & Cash on Delivery Available Across India on Orders Above ₹499",
    ];

    if (map['announcements']) {
      try {
        const parsed = JSON.parse(map['announcements']);
        if (Array.isArray(parsed) && parsed.length > 0) {
          announcements = parsed;
        }
      } catch {}
    }

    return NextResponse.json({
      announcements,
      enabled: map['announcement_bar_enabled'] !== 'false',
      speed: map['announcement_bar_speed'] || 'normal',
      mode: map['announcement_bar_mode'] || 'running',
      bg: map['announcement_bar_bg'] || '#A84358',
      textColor: map['announcement_bar_text_color'] || '#ffffff',
    });
  } catch (error) {
    logger.error('admin.announcements.fetch_failed', { error });
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json();
    const { announcements, enabled, speed, mode, bg, textColor } = body;

    if (Array.isArray(announcements)) {
      await prisma.siteSetting.upsert({
        where: { key: 'announcements' },
        update: { value: JSON.stringify(announcements) },
        create: { key: 'announcements', value: JSON.stringify(announcements) },
      });
    }

    if (typeof enabled === 'boolean') {
      await prisma.siteSetting.upsert({
        where: { key: 'announcement_bar_enabled' },
        update: { value: enabled ? 'true' : 'false' },
        create: { key: 'announcement_bar_enabled', value: enabled ? 'true' : 'false' },
      });
    }

    if (speed) {
      await prisma.siteSetting.upsert({
        where: { key: 'announcement_bar_speed' },
        update: { value: String(speed) },
        create: { key: 'announcement_bar_speed', value: String(speed) },
      });
    }

    if (mode) {
      await prisma.siteSetting.upsert({
        where: { key: 'announcement_bar_mode' },
        update: { value: String(mode) },
        create: { key: 'announcement_bar_mode', value: String(mode) },
      });
    }

    if (bg) {
      await prisma.siteSetting.upsert({
        where: { key: 'announcement_bar_bg' },
        update: { value: String(bg) },
        create: { key: 'announcement_bar_bg', value: String(bg) },
      });
    }

    if (textColor) {
      await prisma.siteSetting.upsert({
        where: { key: 'announcement_bar_text_color' },
        update: { value: String(textColor) },
        create: { key: 'announcement_bar_text_color', value: String(textColor) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('admin.announcements.update_failed', { error });
    return NextResponse.json({ error: 'Failed to update announcements' }, { status: 500 });
  }
}
