import { logger } from '@/lib/logger';
import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import HeroSlider from '@/components/home/HeroSlider';
import ProductCard from '@/components/product/ProductCard';
import CategoryGrid from '@/components/home/CategoryGrid';
import DiscoverHerbicas from '@/components/home/DiscoverHerbicas';
import CustomerResultsSection from '@/components/home/CustomerResultsSection';
import SocialReelsSection from '@/components/home/SocialReelsSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import FAQSection from '@/components/home/FAQSection';
import IngredientsShowcaseSection from '@/components/home/IngredientsShowcaseSection';
import {
  ShieldCheck,
  Truck,
  Sparkles,
  HeartHandshake,
  Leaf,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Star,
} from 'lucide-react';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Herbic Cure | 100% Ayurvedic Hair Oil & Natural Hair Care Solutions',
  description:
    'Experience the ancient science of 21 Himalayan Herbs fusion prepared via 72-hour Kshirapak Vidhi. 100% mineral-oil-free Ayurvedic hair oils, neem combs, and herbal cleansers.',
  alternates: {
    canonical: '/',
  },
};


// High-speed cached data layer: runs in parallel and caches in server memory
const getCachedHomePageData = unstable_cache(
  async () => {
    try {
      const [
        products,
        categories,
        results,
        socialPosts,
        faqs,
        homepageSections,
        reviews,
      ] = await Promise.all([
        prisma.product.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            stockQuantity: true,
            isBestSeller: true,
            isFeatured: true,
            isOnSale: true,
            hasTimer: true,
            rating: true,
            reviewCount: true,
            displayOrder: true,
            images: {
              select: {
                id: true,
                url: true,
                alt: true,
                displayOrder: true,
              },
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        }),
        prisma.category.findMany({
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
        }),
        prisma.customerResult.findMany({
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
        }),
        prisma.socialPost.findMany({
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
        }),
        prisma.fAQ.findMany({
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
        }),
        prisma.homepageSection.findMany({
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
        }),
        prisma.review.findMany({
          where: { isApproved: true },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: 6,
        }),
      ]);

      return {
        products,
        categories,
        results,
        socialPosts,
        faqs,
        homepageSections,
        reviews,
      };
    } catch (error) {
      logger.debug('homepage.query_deferred', { error: (error as any)?.message });
      return {
        products: [],
        categories: [],
        results: [],
        socialPosts: [],
        faqs: [],
        homepageSections: [],
        reviews: [],
      };
    }
  },
  ['herbic-homepage-data-v3'],
  {
    revalidate: 15,
    tags: ['homepage', 'herbic-homepage-data-v3', 'products', 'categories', 'reviews', 'faqs', 'social-posts', 'social-content'],
  }
);


function getTrustBadgeIcon(iconName?: string) {
  const norm = (iconName || '').toLowerCase().trim();
  switch (norm) {
    case 'truck':
    case 'delivery':
      return <Truck className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'sparkles':
    case 'herbs':
      return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'heart':
    case 'customers':
    case 'rating':
      return <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'leaf':
    case 'herbal':
    case 'natural':
      return <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'award':
    case 'certified':
    case 'quality':
      return <Award className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'check':
    case 'verified':
      return <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'clock':
    case 'fast':
      return <Clock className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'star':
      return <Star className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'flame':
      return <Flame className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'shield':
    default:
      return <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />;
  }
}

export default async function HomePage() {
  const {
    products,
    categories,
    results,
    socialPosts,
    faqs,
    homepageSections,
    reviews,
  } = await getCachedHomePageData();

  // Extract Hero configuration if present in CMS
  const heroSection = homepageSections.find(
    (s) => s.sectionType === 'HERO' || s.sectionType === 'HERO_SLIDER'
  );
  let heroSlides = undefined;
  if (heroSection?.contentJson) {
    try {
      const parsed = JSON.parse(heroSection.contentJson);
      if (parsed.slides && parsed.slides.length > 0) {
        heroSlides = parsed.slides;
      }
    } catch (e) {
      logger.warn('homepage.hero_slides_parse_failed', { error: (e as any)?.message });
    }
  }

  // Best Sellers: Prioritize products marked isBestSeller by admin in the CMS, backfilled up to 8
  const markedBestSellers = products.filter((p) => p.isBestSeller);
  const otherProducts = products.filter((p) => !p.isBestSeller);
  const bestSellers = [...markedBestSellers, ...otherProducts].slice(0, 8);

  // Featured products
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 8);

  // Section Component Renderers
  const renderTrustBadges = () => {
    let badges = [
      {
        icon: 'shield',
        title: '100% Ayurvedic',
        subtitle: 'Zero mineral oil & silicones',
      },
      {
        icon: 'truck',
        title: 'Free Express Delivery',
        subtitle: 'On all orders above ₹499',
      },
      {
        icon: 'sparkles',
        title: '21 Potent Herbs',
        subtitle: 'Kshirapak 72hr slow infusion',
      },
      {
        icon: 'heart',
        title: '2,50,000+ Customers',
        subtitle: '4.9/5 rated hair growth results',
      },
    ];

    if (heroSection?.contentJson) {
      try {
        const parsed = JSON.parse(heroSection.contentJson);
        if (Array.isArray(parsed.trustBadges) && parsed.trustBadges.length > 0) {
          badges = parsed.trustBadges;
        }
      } catch (e) {
        // Fallback to default badges
      }
    }

    return (
      <section key="trust-badges" className="bg-white border-b border-stone-200/60 py-3 sm:py-5 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            {badges.map((badge: any, idx: number) => (
              <div
                key={badge.id || idx}
                className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl bg-stone-50/70 border border-stone-100 hover:border-rose-200/60 transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-100/80 text-[#A84358] flex items-center justify-center shrink-0">
                  {getTrustBadgeIcon(badge.icon)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug truncate">
                    {badge.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-500 leading-normal truncate">
                    {badge.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderBestSellers = (
    key: string,
    title?: string,
    subtitle?: string,
    contentJson?: string | null
  ) => {
    let config: {
      badgeText?: string;
      viewAllText?: string;
      viewAllUrl?: string;
      displayLimit?: number;
      productIds?: string[];
    } = {};

    if (contentJson) {
      try {
        config = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
      } catch {}
    }

    const badgeText = config.badgeText || 'Customer Favorites';
    const viewAllText = config.viewAllText || `View All Products (${products.length})`;
    const viewAllUrl = config.viewAllUrl || '/collections/best-sellers';
    const limit = Number(config.displayLimit) || 8;

    let displayList = bestSellers;
    if (Array.isArray(config.productIds) && config.productIds.length > 0) {
      const productMap = new Map(products.map((p) => [p.id, p]));
      const ordered = config.productIds
        .map((id) => productMap.get(id))
        .filter(Boolean) as typeof products;
      if (ordered.length > 0) {
        displayList = ordered;
      }
    }

    if (limit > 0) {
      displayList = displayList.slice(0, limit);
    }

    return (
      <section key={key} className="py-7 sm:py-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-3 py-1 rounded-full mb-2 sm:mb-3">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{badgeText}</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 font-serif">
              {title || 'BEST-SELLING FORMULATIONS'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 sm:mt-2 max-w-xl">
              {subtitle || 'Authentic cold-pressed 21 herbs oils and therapy kits designed to stop hair fall and stimulate deep root strength.'}
            </p>
          </div>

          <Link
            href={viewAllUrl}
            className="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#A84358] hover:underline uppercase tracking-wider"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
          {displayList.map((prod) => (
            <div
              key={prod.id}
              className="w-full"
            >
              <ProductCard
                id={prod.id}
                name={prod.name}
                slug={prod.slug}
                regularPrice={prod.regularPrice}
                salePrice={prod.salePrice}
                image={prod.images[0]?.url || '/images/banners/banner-1.png'}
                rating={prod.rating}
                reviewCount={prod.reviewCount}
                isBestSeller={prod.isBestSeller}
                isOnSale={prod.isOnSale}
                hasTimer={prod.hasTimer}
                stockQuantity={prod.stockQuantity}
              />
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderFeaturedProducts = (key: string, title?: string, subtitle?: string) => {
    const displayList = featuredProducts.length > 0 ? featuredProducts : bestSellers.slice(0, 4);
    return (
      <section key={key} className="py-7 sm:py-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full border-t border-stone-200/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-purple-700 bg-purple-100 px-3 py-1 rounded-full mb-2 sm:mb-3">
              <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
              <span>Ayurvedic Essentials</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 font-serif">
              {title || 'FEATURED FORMULATIONS'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 sm:mt-2 max-w-xl">
              {subtitle || 'Curated herbal products recommended for root health and scalp revitalization.'}
            </p>
          </div>

          <Link
            href="/products"
            className="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#A84358] hover:underline uppercase tracking-wider"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex lg:grid overflow-x-auto lg:overflow-visible snap-x snap-mandatory gap-3 sm:gap-5 lg:gap-8 pb-3 lg:pb-0 no-scrollbar lg:grid-cols-4">
          {displayList.map((prod) => (
            <div
              key={prod.id}
              className="w-[calc(50%-6px)] sm:w-[260px] lg:w-auto shrink-0 lg:shrink snap-start"
            >
              <ProductCard
                id={prod.id}
                name={prod.name}
                slug={prod.slug}
                regularPrice={prod.regularPrice}
                salePrice={prod.salePrice}
                image={prod.images[0]?.url || '/images/banners/banner-1.png'}
                rating={prod.rating}
                reviewCount={prod.reviewCount}
                isBestSeller={prod.isBestSeller}
                isOnSale={prod.isOnSale}
                hasTimer={prod.hasTimer}
                stockQuantity={prod.stockQuantity}
              />
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Section dispatcher mapping sectionType to its rendered JSX
  const renderSection = (sec: { id: string; sectionType: string; title?: string | null; subtitle?: string | null; contentJson?: string | null }) => {
    switch (sec.sectionType) {
      case 'HERO':
      case 'HERO_SLIDER':
        return (
          <React.Fragment key={sec.id}>
            <HeroSlider slides={heroSlides} />
            {renderTrustBadges()}
          </React.Fragment>
        );
      case 'BEST_SELLERS':
        return renderBestSellers(sec.id, sec.title || undefined, sec.subtitle || undefined, sec.contentJson);
      case 'CATEGORIES':
        return <CategoryGrid key={sec.id} categories={categories} />;
      case 'FEATURED_PRODUCTS':
        return renderFeaturedProducts(sec.id, sec.title || undefined, sec.subtitle || undefined);
      case 'DISCOVER':
        return <DiscoverHerbicas key={sec.id} contentJson={sec.contentJson} />;
      case 'RESULTS':
        return <CustomerResultsSection key={sec.id} results={results} />;
      case 'REELS':
        return (
          <SocialReelsSection
            key={sec.id}
            posts={socialPosts}
            title={sec.title || undefined}
            subtitle={sec.subtitle || undefined}
          />
        );
      case 'WHY_US':
        // Removed: Herbic Cure Standard section
        return null;
      case 'REVIEWS':
        return <ReviewsSection key={sec.id} reviews={reviews} />;
      case 'PRODUCT_VIDEOS':
        return null;
      case 'INGREDIENTS':
        return (
          <IngredientsShowcaseSection
            key={sec.id}
            title={sec.title || undefined}
            subtitle={sec.subtitle || undefined}
            contentJson={sec.contentJson || undefined}
          />
        );
      case 'FAQ':
        return <FAQSection key={sec.id} faqs={faqs} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {homepageSections.length > 0 ? (
        homepageSections.map((sec) => renderSection(sec))
      ) : (
        // Locked default order matching Admin CMS configuration:
        // 1. Hero Banner Slider (HERO_SLIDER)
        // 2. Best Selling Hair Rituals (BEST_SELLERS)
        // 3. Explore Ayurvedic Categories (CATEGORIES)
        // 4. Combo (DISCOVER)
        // 5. Loved by Over 50,000+ Customers (REVIEWS)
        // 6. Trending on Social (REELS)
        // 7. The Herbic Cure Promise (WHY_US)
        // 8. Frequently Asked Questions (FAQ)
        <>
          <HeroSlider slides={heroSlides} />
          {renderTrustBadges()}
          {renderBestSellers('default-best-sellers', 'Best Selling Hair Rituals', 'Handcrafted with 21 potent herbs for visible restoration')}
          <CategoryGrid categories={categories} />
          <DiscoverHerbicas contentJson={homepageSections.find((s) => s.sectionType === 'DISCOVER')?.contentJson} />
          <ReviewsSection reviews={reviews} />
          <SocialReelsSection posts={socialPosts} />
          <FAQSection faqs={faqs} />
        </>
      )}
    </div>
  );
}
