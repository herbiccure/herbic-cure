import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Herbic Cure | 100% Ayurvedic Hair Oil & Natural Hair Care Solutions',
  description:
    'Experience the ancient science of 21 Himalayan Herbs fusion prepared via 72-hour Kshirapak Vidhi. 100% mineral-oil-free Ayurvedic hair oils, neem combs, and herbal cleansers.',
  alternates: {
    canonical: '/',
  },
};

export const revalidate = 60;

import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HeroSlider from '@/components/home/HeroSlider';
import ProductCard from '@/components/product/ProductCard';
import CategoryGrid from '@/components/home/CategoryGrid';
import DiscoverHerbicas from '@/components/home/DiscoverHerbicas';
import CustomerResultsSection from '@/components/home/CustomerResultsSection';
import SocialReelsSection from '@/components/home/SocialReelsSection';
import WhyHerbicasSection from '@/components/home/WhyHerbicasSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import FAQSection from '@/components/home/FAQSection';
import {
  ShieldCheck,
  Truck,
  Sparkles,
  HeartHandshake,
  ArrowRight,
  Flame,
  Star,
} from 'lucide-react';

export default async function HomePage() {
  // Database-driven fetching per PRD Section 51
  const [
    products,
    categories,
    results,
    socialPosts,
    faqs,
    homepageSections,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        images: {
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
  ]);

  // Fetch admin-selected featured reviews for the home page (up to 6)
  const featuredReviews = await prisma.review.findMany({
    where: { isApproved: true, isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  // If admin selected fewer than 6, backfill with most recent approved reviews
  let reviews = featuredReviews;
  if (reviews.length < 6) {
    const featuredIds = featuredReviews.map((r) => r.id);
    const remaining = 6 - reviews.length;
    const backfill = await prisma.review.findMany({
      where: {
        isApproved: true,
        id: { notIn: featuredIds },
      },
      orderBy: { createdAt: 'desc' },
      take: remaining,
    });
    reviews = [...reviews, ...backfill];
  }

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
      console.error('Failed to parse hero slides', e);
    }
  }

  // Best Sellers: Prioritize products marked isBestSeller by admin in the CMS, backfilled up to 8
  const markedBestSellers = products.filter((p) => p.isBestSeller);
  const otherProducts = products.filter((p) => !p.isBestSeller);
  const bestSellers = [...markedBestSellers, ...otherProducts].slice(0, 8);

  // Featured products
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 8);

  // Section Component Renderers
  const renderTrustBadges = () => (
    <section key="trust-badges" className="bg-white border-b border-stone-200/60 py-3 sm:py-5 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl bg-stone-50/70 border border-stone-100">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-100/80 text-[#A84358] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                100% Ayurvedic
              </h4>
              <p className="text-[10px] sm:text-xs text-stone-500 leading-normal">
                Zero mineral oil &amp; silicones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl bg-stone-50/70 border border-stone-100">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-100/80 text-[#A84358] flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                Free Express Delivery
              </h4>
              <p className="text-[10px] sm:text-xs text-stone-500 leading-normal">
                On all orders above ₹499
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl bg-stone-50/70 border border-stone-100">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-100/80 text-[#A84358] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                21 Potent Herbs
              </h4>
              <p className="text-[10px] sm:text-xs text-stone-500 leading-normal">
                Kshirapak 72hr slow infusion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl bg-stone-50/70 border border-stone-100">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-100/80 text-[#A84358] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                2,50,000+ Customers
              </h4>
              <p className="text-[10px] sm:text-xs text-stone-500 leading-normal">
                4.9/5 rated hair growth results
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderBestSellers = (key: string, title?: string, subtitle?: string) => (
    <section key={key} className="py-7 sm:py-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-3 py-1 rounded-full mb-2 sm:mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Customer Favorites</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 font-serif">
            {title || 'BEST-SELLING FORMULATIONS'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 sm:mt-2 max-w-xl">
            {subtitle || 'Authentic cold-pressed 21 herbs oils and therapy kits designed to stop hair fall and stimulate deep root strength.'}
          </p>
        </div>

        <Link
          href="/collections/best-sellers"
          className="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#A84358] hover:underline uppercase tracking-wider"
        >
          <span>View All Products ({products.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex lg:grid overflow-x-auto lg:overflow-visible snap-x snap-mandatory gap-3 sm:gap-5 lg:gap-8 pb-3 lg:pb-0 no-scrollbar lg:grid-cols-4">
        {bestSellers.map((prod) => (
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
  const renderSection = (sec: { id: string; sectionType: string; title?: string | null; subtitle?: string | null }) => {
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
        return renderBestSellers(sec.id, sec.title || undefined, sec.subtitle || undefined);
      case 'CATEGORIES':
        return <CategoryGrid key={sec.id} categories={categories} />;
      case 'FEATURED_PRODUCTS':
        return renderFeaturedProducts(sec.id, sec.title || undefined, sec.subtitle || undefined);
      case 'DISCOVER':
        return <DiscoverHerbicas key={sec.id} />;
      case 'RESULTS':
        return <CustomerResultsSection key={sec.id} results={results} />;
      case 'REELS':
        return <SocialReelsSection key={sec.id} posts={socialPosts} />;
      case 'WHY_US':
        return <WhyHerbicasSection key={sec.id} />;
      case 'REVIEWS':
        return <ReviewsSection key={sec.id} reviews={reviews} />;
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
        // Fallback default order if no CMS sections exist
        <>
          <HeroSlider slides={heroSlides} />
          {renderTrustBadges()}
          {renderBestSellers('default-best-sellers')}
          <CategoryGrid categories={categories} />
          <DiscoverHerbicas />
          <CustomerResultsSection results={results} />
          <SocialReelsSection posts={socialPosts} />
          <WhyHerbicasSection />
          <ReviewsSection reviews={reviews} />
          <FAQSection faqs={faqs} />
        </>
      )}
    </div>
  );
}
