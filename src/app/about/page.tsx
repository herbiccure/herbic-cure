import type { Metadata } from 'next';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Heart,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  Leaf,
  Flame,
  Star,
  Truck,
  Check,
} from 'lucide-react';
import { getAboutPageData } from '@/lib/about';

export const revalidate = 60; // ISR cache revalidation every minute

function getHighlightIcon(iconName: string) {
  switch (iconName?.toLowerCase()) {
    case 'shield':
      return <ShieldCheck className="w-5 h-5 text-[#A84358]" />;
    case 'sparkles':
      return <Sparkles className="w-5 h-5 text-[#A84358]" />;
    case 'clock':
      return <Clock className="w-5 h-5 text-[#A84358]" />;
    case 'award':
      return <Award className="w-5 h-5 text-[#A84358]" />;
    case 'leaf':
      return <Leaf className="w-5 h-5 text-[#A84358]" />;
    case 'flame':
      return <Flame className="w-5 h-5 text-[#A84358]" />;
    case 'heart':
      return <Heart className="w-5 h-5 text-[#A84358]" />;
    case 'star':
      return <Star className="w-5 h-5 text-[#A84358]" />;
    case 'truck':
      return <Truck className="w-5 h-5 text-[#A84358]" />;
    case 'check':
    default:
      return <CheckCircle2 className="w-5 h-5 text-[#A84358]" />;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getAboutPageData();
  return {
    title: data.seo.metaTitle || 'Our Heritage & Ayurvedic Science | Herbic Cure',
    description:
      data.seo.metaDescription ||
      'Discover how Herbic Cure revives ancient Kshirapak Vidhi using 21 rare Himalayan herbs for deep root nourishment.',
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title: data.seo.metaTitle,
      description: data.seo.metaDescription,
      url: '/about',
      type: 'website',
    },
  };
}

export default async function AboutPage() {
  const data = await getAboutPageData();

  return (
    <div className="min-h-screen bg-[#FCF8F9] selection:bg-[#8C3A4F]/20 selection:text-[#8C3A4F]">
      {/* 1. HERO HEADER */}
      <section className="relative py-20 sm:py-24 bg-[#f4ebe1] border-b border-stone-200/80 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          {data.hero.badge && (
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3.5 py-1 rounded-full mb-4">
              {data.hero.badge}
            </span>
          )}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 font-serif leading-tight tracking-tight">
            {data.hero.heading}
          </h1>
          <p className="text-base sm:text-lg text-stone-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            {data.hero.subtitle}
          </p>
        </div>
        {/* Soft background glow decoration */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8C3A4F]/5 rounded-full blur-3xl pointer-events-none -mt-20" />
      </section>

      {/* 2. STATS BAR */}
      {Array.isArray(data.stats) && data.stats.length > 0 && (
        <section className="bg-white border-b border-stone-200/70 py-10 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-stone-100">
              {data.stats.map((stat, idx) => (
                <div key={stat.id || idx} className={`pt-4 md:pt-0 ${idx > 0 ? 'md:pl-6' : ''}`}>
                  <div className="text-2xl sm:text-4xl font-black font-serif text-[#A84358]">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900 mt-1">
                    {stat.label}
                  </div>
                  {stat.helper && (
                    <div className="text-[11px] text-stone-500 mt-0.5">{stat.helper}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. PHILOSOPHY & STORY */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Featured Image */}
          <div className="relative w-full aspect-4/3 rounded-3xl overflow-hidden shadow-xl border border-stone-200 group">
            <Image
              src={data.philosophy.image || '/images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg'}
              alt={data.philosophy.heading}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Narrative Content */}
          <div className="space-y-6">
            {data.philosophy.badge && (
              <span className="text-xs font-bold uppercase tracking-widest text-[#A84358]">
                {data.philosophy.badge}
              </span>
            )}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif leading-tight">
              {data.philosophy.heading}
            </h2>
            <div className="text-sm sm:text-base text-stone-600 leading-relaxed space-y-4">
              {data.philosophy.description.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* 4 Feature Highlights */}
            {Array.isArray(data.philosophy.highlights) && data.philosophy.highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {data.philosophy.highlights.map((hl, idx) => (
                  <div
                    key={hl.id || idx}
                    className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs hover:border-[#8C3A4F]/30 transition-all flex items-start gap-3"
                  >
                    <div className="p-2 rounded-xl bg-rose-50 text-[#A84358] shrink-0">
                      {getHighlightIcon(hl.icon)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{hl.title}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{hl.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Button */}
            {data.philosophy.ctaText && (
              <div className="pt-4">
                <Link
                  href={data.philosophy.ctaUrl || '/products'}
                  className="inline-flex items-center gap-2 bg-[#A84358] hover:bg-[#45363B] text-white text-xs font-bold px-6 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg hover:translate-x-0.5"
                >
                  <span>{data.philosophy.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. MISSION & CORE PILLARS */}
      <section className="py-16 sm:py-20 bg-white border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            {data.mission.badge && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-3">
                {data.mission.badge}
              </span>
            )}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif">
              {data.mission.heading}
            </h2>
          </div>

          {/* Mission & Vision Statements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-[#FCF8F9] border border-[#EAC9D1] rounded-3xl p-6 sm:p-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C3A4F]">Our Mission</span>
              <p className="text-sm sm:text-base text-stone-800 font-serif mt-2 leading-relaxed italic">
                &ldquo;{data.mission.missionText}&rdquo;
              </p>
            </div>
            <div className="bg-[#f4ebe1] border border-stone-200 rounded-3xl p-6 sm:p-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A84358]">Our Vision</span>
              <p className="text-sm sm:text-base text-stone-800 font-serif mt-2 leading-relaxed italic">
                &ldquo;{data.mission.visionText}&rdquo;
              </p>
            </div>
          </div>

          {/* 4 Core Pillars */}
          {Array.isArray(data.mission.pillars) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.mission.pillars.map((pillar, idx) => (
                <div
                  key={pillar.id || idx}
                  className="bg-[#FCF8F9] border border-stone-200/80 rounded-2xl p-6 hover:shadow-md transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EAC9D1] text-[#8C3A4F] flex items-center justify-center">
                    {getHighlightIcon(pillar.icon)}
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 font-serif">{pillar.title}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">{pillar.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. 3-STEP SACRED PROCESS */}
      {data.process && (
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            {data.process.badge && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-3">
                {data.process.badge}
              </span>
            )}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif">
              {data.process.heading}
            </h2>
            {data.process.subtitle && (
              <p className="text-sm text-stone-600 mt-2 max-w-xl mx-auto leading-relaxed">
                {data.process.subtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.process.steps.map((st, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black font-serif text-[#A84358]">
                      {st.stepNumber}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[10px] font-bold text-[#A84358] tracking-wider uppercase">
                      {st.tag}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-stone-900 font-serif mb-2">{st.title}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">{st.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. BOTTOM CTA BANNER */}
      {data.ctaBanner && (
        <section className="py-20 bg-[#2D1B1B] text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-6">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-300 bg-rose-950/60 border border-rose-800/60 px-3.5 py-1 rounded-full">
              Begin Your Journey
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-serif leading-tight">
              {data.ctaBanner.heading}
            </h2>
            <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
              {data.ctaBanner.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {data.ctaBanner.primaryCtaText && (
                <Link
                  href={data.ctaBanner.primaryCtaUrl || '/products'}
                  className="bg-[#A84358] hover:bg-[#8C3A4F] text-white text-xs font-bold px-7 py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl"
                >
                  {data.ctaBanner.primaryCtaText}
                </Link>
              )}
              {data.ctaBanner.secondaryCtaText && (
                <Link
                  href={data.ctaBanner.secondaryCtaUrl || '/ingredients'}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-7 py-3.5 rounded-full transition-all"
                >
                  {data.ctaBanner.secondaryCtaText}
                </Link>
              )}
            </div>
          </div>
          {/* Subtle warm glow background element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        </section>
      )}
    </div>
  );
}
