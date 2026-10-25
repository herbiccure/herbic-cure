import { logger } from '@/lib/logger';

export interface AboutHighlight {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

export interface AboutPillar {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface AboutStat {
  id: string;
  value: string;
  label: string;
  helper?: string;
}

export interface AboutProcessStep {
  stepNumber: string;
  title: string;
  description: string;
  tag: string;
}

export interface AboutPageData {
  seo: {
    metaTitle: string;
    metaDescription: string;
  };
  hero: {
    badge: string;
    heading: string;
    subtitle: string;
  };
  philosophy: {
    badge: string;
    heading: string;
    description: string;
    image: string;
    highlights: AboutHighlight[];
    ctaText: string;
    ctaUrl: string;
  };
  mission: {
    badge: string;
    heading: string;
    missionText: string;
    visionText: string;
    pillars: AboutPillar[];
  };
  stats: AboutStat[];
  process: {
    badge: string;
    heading: string;
    subtitle: string;
    steps: AboutProcessStep[];
  };
  ctaBanner: {
    heading: string;
    subtitle: string;
    primaryCtaText: string;
    primaryCtaUrl: string;
    secondaryCtaText: string;
    secondaryCtaUrl: string;
  };
}

export const DEFAULT_ABOUT_DATA: AboutPageData = {
  seo: {
    metaTitle: 'Our Heritage & Ayurvedic Science | Herbic Cure',
    metaDescription:
      'Discover how Herbic Cure revives ancient Kshirapak Vidhi using 21 rare Himalayan herbs for deep root nourishment.',
  },
  hero: {
    badge: 'Our Ancient Heritage',
    heading: 'Inspired by Himalayan Herbs. Crafted by Ayurveda.',
    subtitle:
      'At Herbic Cure, we believe true hair transformation begins at the follicle. We combine 21 authentic botanical herbs with cold-pressed oils through time-honored slow boiling.',
  },
  philosophy: {
    badge: 'The Kshirapak Vidhi Method',
    heading: 'Why Cold Infusion & 72-Hour Brewing Makes All The Difference',
    description:
      'Unlike commercial cosmetic oils diluted with mineral oil and synthetic silicones, every batch of Herbic Cure hair elixir is slowly prepared over 72 hours. Fresh herbal extracts of Bhringraj, Brahmi, Jatamansi, and Amla are infused into cold-pressed virgin coconut and sesame oils using ancient Kshirapak Vidhi principles.',
    image: '/images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg',
    highlights: [
      {
        id: 'hl-1',
        icon: 'shield',
        title: 'Zero Mineral Oil',
        subtitle: '100% pure botanical cold-pressed base',
      },
      {
        id: 'hl-2',
        icon: 'sparkles',
        title: '21 Herbs Infusion',
        subtitle: 'Root-deep nourishment and follicle stimulation',
      },
      {
        id: 'hl-3',
        icon: 'clock',
        title: '72hr Slow Cooking',
        subtitle: 'Ancient Kshirapak boiling for bio-active potency',
      },
      {
        id: 'hl-4',
        icon: 'award',
        title: 'Ayush Certified',
        subtitle: 'Authentic Ayurvedic formulation standards',
      },
    ],
    ctaText: 'Explore Formulations',
    ctaUrl: '/products',
  },
  mission: {
    badge: 'Our Core Purpose',
    heading: 'Purity, Ancient Wisdom & Proven Follicular Health',
    missionText:
      'To revive sacred Ayurvedic hair rituals that nourish both root and soul, replacing toxic synthetic chemicals with 100% potent natural botanicals.',
    visionText:
      'Empowering millions across India and beyond to experience dense, vibrant, naturally restored hair without compromise or artificial shortcuts.',
    pillars: [
      {
        id: 'p-1',
        icon: 'leaf',
        title: 'Wild Himalayan Herbs',
        description:
          'Sourced directly from native Himalayan terroirs where herbs grow under optimal soil, sunlight, and altitude conditions.',
      },
      {
        id: 'p-2',
        icon: 'flame',
        title: 'Slow Fire Kshirapak',
        description:
          'Milk, water, and herbal decoctions simmer over low woodfire embers until only the nutrient-dense medicated oil essence remains.',
      },
      {
        id: 'p-3',
        icon: 'check',
        title: 'Zero Silicones or Toxins',
        description:
          'No paraffin, artificial fragrance, parabens, or synthetic silicones that coat and suffocate your scalp follicles.',
      },
      {
        id: 'p-4',
        icon: 'heart',
        title: 'Cruelty-Free & Ethical',
        description:
          'Never tested on animals, ethically harvested in harmony with local farmers, and packed in recyclable containers.',
      },
    ],
  },
  stats: [
    {
      id: 'stat-1',
      value: '2,50,000+',
      label: 'Happy Customers',
      helper: 'Across Pan-India',
    },
    {
      id: 'stat-2',
      value: '21',
      label: 'Himalayan Herbs',
      helper: 'Roots & Botanicals',
    },
    {
      id: 'stat-3',
      value: '72 Hours',
      label: 'Slow Infusion',
      helper: 'Kshirapak Cooking',
    },
    {
      id: 'stat-4',
      value: '98.4%',
      label: 'Satisfaction Rate',
      helper: 'Verified Reviews',
    },
  ],
  process: {
    badge: 'Our Craftsmanship',
    heading: 'The Sacred 3-Step Kshirapak Ritual',
    subtitle:
      'A centuries-old medicinal oil preparation described in the classical Charaka Samhita.',
    steps: [
      {
        stepNumber: '01',
        tag: 'ETHICAL HARVEST',
        title: 'Wild Foraging & Root Sun-Drying',
        description:
          'Roots of Bhringraj, Jatamansi, and Nagarmotha are handpicked at peak seasonal potency, gently cleaned, and sun-dried to preserve their volatile nutrients.',
      },
      {
        stepNumber: '02',
        tag: '72-HR KSHIRAPAK',
        title: 'Decoction Boiling with Pure Milk',
        description:
          'Herbs are simmered in goat or cow milk and pure spring water decoction (Kwath) over a continuous slow flame for 72 hours until all moisture evaporates, transferring all medicinal phytonutrients into pure sesame & coconut oils.',
      },
      {
        stepNumber: '03',
        tag: 'PURE CLARIFICATION',
        title: 'Triple-Cloth Filtration & Cold Packaging',
        description:
          'The rich golden oil is filtered through unbleached natural muslin cloth, free from heat damage or artificial preservatives, preserving 100% natural aroma and bio-activity.',
      },
    ],
  },
  ctaBanner: {
    heading: 'Experience Ancient Ayurvedic Hair Transformation',
    subtitle:
      'Join over 2,50,000 customers who revived their roots with authentic 21-herb Kshirapak hair oil.',
    primaryCtaText: 'Shop All Formulations',
    primaryCtaUrl: '/products',
    secondaryCtaText: 'Explore 21 Ingredients',
    secondaryCtaUrl: '/ingredients',
  },
};

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
