// Pure, client-safe types and default constants for About Page
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
