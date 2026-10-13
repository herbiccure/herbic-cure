import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [setting, offerSection, logoSetting, brandSetting] = await Promise.all([
      prisma.siteSetting.findUnique({
        where: { key: 'navbar_offers_enabled' },
      }),
      prisma.homepageSection.findFirst({
        where: { sectionType: 'OFFER_BANNER' },
        select: { active: true },
      }),
      prisma.siteSetting.findFirst({
        where: { key: { in: ['store_logo', 'logo_url'] } },
      }),
      prisma.siteSetting.findUnique({
        where: { key: 'brand_name' },
      }),
    ]);

    const navbarOffersEnabled = setting ? setting.value === 'true' : false;
    const offerBannerActive = offerSection ? offerSection.active : false;
    const logoUrl = logoSetting?.value?.trim() || '/images/banners/herbic-cure-logo.png';
    const brandName = brandSetting?.value?.trim() || 'Herbic Cure';

    return NextResponse.json({
      navbarOffersEnabled,
      offerBannerActive,
      logoUrl,
      brandName,
    });
  } catch (error) {
    // Graceful fallback: default to false (OFF) and standard brand logo
    return NextResponse.json({
      navbarOffersEnabled: false,
      offerBannerActive: false,
      logoUrl: '/images/banners/herbic-cure-logo.png',
      brandName: 'Herbic Cure',
    });
  }
}
