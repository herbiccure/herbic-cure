import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

let cachedAnnouncements: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds memory cache

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export async function GET() {
  const now = Date.now();
  if (cachedAnnouncements && now - lastCacheTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedAnnouncements, { headers: CACHE_HEADERS });
  }
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

    cachedAnnouncements = {
      announcements,
      enabled: map['announcement_bar_enabled'] !== 'false',
      speed: map['announcement_bar_speed'] || 'normal',
      mode: map['announcement_bar_mode'] || 'running',
      bg: map['announcement_bar_bg'] || '#A84358',
      textColor: map['announcement_bar_text_color'] || '#ffffff',
    };
    lastCacheTime = now;
    return NextResponse.json(cachedAnnouncements, { headers: CACHE_HEADERS });

  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return NextResponse.json({
      announcements: [
        "Experience the power of South India's best natural Hair Oils",
        "Handcrafted with 21 Himalayan Herbs & Authentic Kshirapak Vidhi — 100% Pure & Toxin-Free",
        "Free Express Shipping & Cash on Delivery Available Across India on Orders Above ₹499",
      ],
      enabled: true,
      speed: 'normal',
      mode: 'running',
      bg: '#A84358',
      textColor: '#ffffff',
    }, { headers: CACHE_HEADERS });
  }
}
