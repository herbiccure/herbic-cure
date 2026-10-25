import 'server-only';
import { logger } from '@/lib/logger';
import { AboutPageData, DEFAULT_ABOUT_DATA } from '@/types/about';

export * from '@/types/about';

let aboutCache: AboutPageData | null = null;

export async function getAboutPageData(): Promise<AboutPageData> {
  if (aboutCache) {
    return aboutCache;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const record = await prisma.siteSetting.findUnique({
      where: { key: 'page_about' },
    });

    if (record?.value) {
      const parsed = JSON.parse(record.value);
      const merged: AboutPageData = {
        seo: {
          metaTitle: parsed.seo?.metaTitle || DEFAULT_ABOUT_DATA.seo.metaTitle,
          metaDescription: parsed.seo?.metaDescription || DEFAULT_ABOUT_DATA.seo.metaDescription,
        },
        hero: {
          badge: parsed.hero?.badge || DEFAULT_ABOUT_DATA.hero.badge,
          heading: parsed.hero?.heading || DEFAULT_ABOUT_DATA.hero.heading,
          subtitle: parsed.hero?.subtitle || DEFAULT_ABOUT_DATA.hero.subtitle,
        },
        philosophy: {
          badge: parsed.philosophy?.badge || DEFAULT_ABOUT_DATA.philosophy.badge,
          heading: parsed.philosophy?.heading || DEFAULT_ABOUT_DATA.philosophy.heading,
          description: parsed.philosophy?.description || DEFAULT_ABOUT_DATA.philosophy.description,
          image: parsed.philosophy?.image || DEFAULT_ABOUT_DATA.philosophy.image,
          highlights:
            Array.isArray(parsed.philosophy?.highlights) && parsed.philosophy.highlights.length > 0
              ? parsed.philosophy.highlights
              : DEFAULT_ABOUT_DATA.philosophy.highlights,
          ctaText: parsed.philosophy?.ctaText || DEFAULT_ABOUT_DATA.philosophy.ctaText,
          ctaUrl: parsed.philosophy?.ctaUrl || DEFAULT_ABOUT_DATA.philosophy.ctaUrl,
        },
        mission: {
          badge: parsed.mission?.badge || DEFAULT_ABOUT_DATA.mission.badge,
          heading: parsed.mission?.heading || DEFAULT_ABOUT_DATA.mission.heading,
          missionText: parsed.mission?.missionText || DEFAULT_ABOUT_DATA.mission.missionText,
          visionText: parsed.mission?.visionText || DEFAULT_ABOUT_DATA.mission.visionText,
          pillars:
            Array.isArray(parsed.mission?.pillars) && parsed.mission.pillars.length > 0
              ? parsed.mission.pillars
              : DEFAULT_ABOUT_DATA.mission.pillars,
        },
        stats:
          Array.isArray(parsed.stats) && parsed.stats.length > 0
            ? parsed.stats
            : DEFAULT_ABOUT_DATA.stats,
        process: {
          badge: parsed.process?.badge || DEFAULT_ABOUT_DATA.process.badge,
          heading: parsed.process?.heading || DEFAULT_ABOUT_DATA.process.heading,
          subtitle: parsed.process?.subtitle || DEFAULT_ABOUT_DATA.process.subtitle,
          steps:
            Array.isArray(parsed.process?.steps) && parsed.process.steps.length > 0
              ? parsed.process.steps
              : DEFAULT_ABOUT_DATA.process.steps,
        },
        ctaBanner: {
          heading: parsed.ctaBanner?.heading || DEFAULT_ABOUT_DATA.ctaBanner.heading,
          subtitle: parsed.ctaBanner?.subtitle || DEFAULT_ABOUT_DATA.ctaBanner.subtitle,
          primaryCtaText: parsed.ctaBanner?.primaryCtaText || DEFAULT_ABOUT_DATA.ctaBanner.primaryCtaText,
          primaryCtaUrl: parsed.ctaBanner?.primaryCtaUrl || DEFAULT_ABOUT_DATA.ctaBanner.primaryCtaUrl,
          secondaryCtaText: parsed.ctaBanner?.secondaryCtaText || DEFAULT_ABOUT_DATA.ctaBanner.secondaryCtaText,
          secondaryCtaUrl: parsed.ctaBanner?.secondaryCtaUrl || DEFAULT_ABOUT_DATA.ctaBanner.secondaryCtaUrl,
        },
      };

      aboutCache = merged;
      return merged;
    }
  } catch (error: any) {
    logger.debug('about.fallback_used', { error: error?.message });
  }

  return DEFAULT_ABOUT_DATA;
}

export async function saveAboutPageData(data: Partial<AboutPageData>): Promise<AboutPageData> {
  const current = await getAboutPageData();

  const updated: AboutPageData = {
    seo: {
      metaTitle: data.seo?.metaTitle ?? current.seo.metaTitle,
      metaDescription: data.seo?.metaDescription ?? current.seo.metaDescription,
    },
    hero: {
      badge: data.hero?.badge ?? current.hero.badge,
      heading: data.hero?.heading ?? current.hero.heading,
      subtitle: data.hero?.subtitle ?? current.hero.subtitle,
    },
    philosophy: {
      badge: data.philosophy?.badge ?? current.philosophy.badge,
      heading: data.philosophy?.heading ?? current.philosophy.heading,
      description: data.philosophy?.description ?? current.philosophy.description,
      image: data.philosophy?.image ?? current.philosophy.image,
      highlights: data.philosophy?.highlights ?? current.philosophy.highlights,
      ctaText: data.philosophy?.ctaText ?? current.philosophy.ctaText,
      ctaUrl: data.philosophy?.ctaUrl ?? current.philosophy.ctaUrl,
    },
    mission: {
      badge: data.mission?.badge ?? current.mission.badge,
      heading: data.mission?.heading ?? current.mission.heading,
      missionText: data.mission?.missionText ?? current.mission.missionText,
      visionText: data.mission?.visionText ?? current.mission.visionText,
      pillars: data.mission?.pillars ?? current.mission.pillars,
    },
    stats: data.stats ?? current.stats,
    process: {
      badge: data.process?.badge ?? current.process.badge,
      heading: data.process?.heading ?? current.process.heading,
      subtitle: data.process?.subtitle ?? current.process.subtitle,
      steps: data.process?.steps ?? current.process.steps,
    },
    ctaBanner: {
      heading: data.ctaBanner?.heading ?? current.ctaBanner.heading,
      subtitle: data.ctaBanner?.subtitle ?? current.ctaBanner.subtitle,
      primaryCtaText: data.ctaBanner?.primaryCtaText ?? current.ctaBanner.primaryCtaText,
      primaryCtaUrl: data.ctaBanner?.primaryCtaUrl ?? current.ctaBanner.primaryCtaUrl,
      secondaryCtaText: data.ctaBanner?.secondaryCtaText ?? current.ctaBanner.secondaryCtaUrl,
      secondaryCtaUrl: data.ctaBanner?.secondaryCtaUrl ?? current.ctaBanner.secondaryCtaUrl,
    },
  };

  const { prisma } = await import('@/lib/prisma');
  aboutCache = updated;

  await prisma.siteSetting.upsert({
    where: { key: 'page_about' },
    update: { value: JSON.stringify(updated) },
    create: { key: 'page_about', value: JSON.stringify(updated) },
  });

  return updated;
}
