import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const revalidate = 0;

const getNavigationSettings = unstable_cache(
  async () => {
    const [setting, offerSection, logoSetting, brandSetting, feeSetting, thresholdSetting, codSetting] = await Promise.all([
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
      prisma.siteSetting.findUnique({
        where: { key: 'standard_shipping_fee' },
      }),
      prisma.siteSetting.findUnique({
        where: { key: 'free_shipping_threshold' },
      }),
      prisma.siteSetting.findUnique({
        where: { key: 'cod_available' },
      }),
    ]);

    const navbarOffersEnabled = setting ? setting.value === 'true' : false;
    const offerBannerActive = offerSection ? offerSection.active : false;
    const logoUrl = logoSetting?.value?.trim() || '/images/banners/herbic-cure-logo.png';
    const brandName = brandSetting?.value?.trim() || 'Herbic Cure';
    const standardShippingFee = feeSetting?.value ? Number(feeSetting.value) : 89;
    const freeShippingThreshold = thresholdSetting?.value ? Number(thresholdSetting.value) : 499;
    const codAvailable = codSetting ? codSetting.value === 'true' : true;

    return {
      navbarOffersEnabled,
      offerBannerActive,
      logoUrl,
      brandName,
      standardShippingFee,
      freeShippingThreshold,
      codAvailable,
    };
  },
  ['navigation-settings-cache'],
  {
    revalidate: 15,
    tags: ['settings', 'navigation'],
  }
);

export async function GET() {
  try {
    const data = await getNavigationSettings();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        navbarOffersEnabled: false,
        offerBannerActive: false,
        logoUrl: '/images/banners/herbic-cure-logo.png',
        brandName: 'Herbic Cure',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    );
  }
}
