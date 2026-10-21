import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import {

  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  ArrowRight,
  Flame,
  Lightbulb,
} from 'lucide-react';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'How to Use & Ayurvedic Hair Care Guides | Herbic Cure',
  description:
    'Step-by-step application rituals, scalp massage guides, and usage frequency for Herbic Cure 21 Herbs Fusion Hair Oil and Kshirapak formulations.',
  alternates: {
    canonical: '/hair-care-tips',
  },
};

export default async function HowToUsePage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  });

  const steps = [
    {
      step: '01',
      title: 'Prep & Detangle Scalp',
      subtitle: 'Gentle Stimulatory Combing',
      description:
        'Detangle dry hair with a handcrafted Pure Neem Wood Comb. Combing from crown to tips stimulates scalp micro-circulation and opens follicles to absorb herbal actives.',
      tag: 'Step 1 • 2 mins',
    },
    {
      step: '02',
      title: 'Dispense & Warm Elixir',
      subtitle: 'Activate 21 Himalayan Herbs',
      description:
        'Pour 5–10 ml of Herbic Cure 21 Herbs Fusion Hair Oil into your palm or use the root comb applicator. Rub palms gently together to activate the cold-pressed botanical essences.',
      tag: 'Step 2 • 1 min',
    },
    {
      step: '03',
      title: 'Circular Scalp Massage',
      subtitle: 'Root-to-Tip Distribution',
      description:
        'Section hair into 4 quadrants. Gently massage into scalp using fingertips in small circular motions for 5–7 minutes. Focus on crown, receding edges, and thinning zones.',
      tag: 'Step 3 • 5-7 mins',
    },
    {
      step: '04',
      title: 'Nourish & Cleanse',
      subtitle: 'Overnight Deep Immersion',
      description:
        'Leave oil in hair for a minimum of 2 hours, or overnight for intensive Kshirapak herbal infusion. Wash off thoroughly with a gentle sulfate-free herbal shampoo and lukewarm water.',
      tag: 'Step 4 • Overnight',
    },
  ];

  const regimens = [
    {
      badge: 'Active Hair Fall',
      frequency: '3 to 4 Times Weekly',
      timing: 'Overnight Application',
      description:
        'For individuals experiencing active shedding or noticeable thinning. Apply 10ml generously at bedtime, 3-4 nights a week.',
      highlight: true,
    },
    {
      badge: 'Growth Maintenance',
      frequency: '2 Times Weekly',
      timing: '2–3 Hours Pre-Wash',
      description:
        'For healthy scalp maintenance, split-end repair, and lustrous thickness. Leave on for 2 hours before your regular hair wash.',
      highlight: false,
    },
    {
      badge: 'Beard & Patch Regrowth',
      frequency: 'Daily (Every Night)',
      timing: 'Bedtime Leave-In',
      description:
        'For filling patchy beard areas and moustache density. Apply 3–4 drops directly to facial skin and massage for 2 minutes every night.',
      highlight: false,
    },
  ];

  return (
    <div className="bg-[#FCF8F9] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-4 py-1.5 rounded-full mb-3 border border-rose-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ayurvedic Application Ritual</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2D1B1B] font-serif tracking-tight">
            How to Use & Hair Care Guides
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
            Master the authentic 4-step South Indian Kshirapak ritual for maximum root penetration,
            accelerated hair growth, and deep scalp rejuvenation.
          </p>
        </div>

        {/* 4-Step Visual Application Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100/90 shadow-xs hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/70 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif text-3xl font-extrabold text-[#A84358]">
                    {s.step}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A84358] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#2D1B1B] group-hover:text-[#A84358] transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs font-semibold text-rose-700/80 mt-0.5 mb-2.5">
                  {s.subtitle}
                </p>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-rose-100 flex items-center gap-1.5 text-[11px] font-bold text-[#A84358]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Crucial for Root Absorption</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended Regimens */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-rose-100 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold text-[#A84358] uppercase tracking-widest block mb-1">
              Personalized Routine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2D1B1B]">
              Recommended Usage Frequency
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Follow the regimen that matches your current scalp and hair needs for visible results in 60–90 days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {regimens.map((r, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border transition-all ${
                  r.highlight
                    ? 'bg-[#FCF4F7] border-rose-300 shadow-sm ring-1 ring-[#A84358]/20'
                    : 'bg-white border-stone-200 hover:border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      r.highlight
                        ? 'bg-[#A84358] text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {r.badge}
                  </span>
                  {r.highlight && (
                    <span className="text-[10px] font-extrabold text-[#A84358] flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-[#A84358]" /> Most Popular
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-[#2D1B1B]">{r.frequency}</h4>
                <div className="flex items-center gap-1.5 text-xs text-[#A84358] font-semibold mt-1 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{r.timing}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro-Tips Callout */}
        <div className="bg-gradient-to-br from-[#45363B] to-[#2D1B1B] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>Ayurvedic Vaidya Expert Tips</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif">
              3 Rules for 10x Hair Regrowth Results
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 text-xs leading-relaxed text-rose-100/90">
              <div className="space-y-1.5">
                <h5 className="font-bold text-white text-sm">1. Never Boil Directly</h5>
                <p>Do not heat the oil on an open flame. Rub between palms or place bottle in a cup of warm water to preserve herbal enzymes.</p>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-bold text-white text-sm">2. Use Neem Wood Comb</h5>
                <p>Plastic combs create friction and hair breakage. Pure neem wood naturally diffuses scalp sebum and inhibits dandruff microbes.</p>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-bold text-white text-sm">3. Consistency is Key</h5>
                <p>Ayurvedic herbs act deep in the hair root follicle cycle. Visible baby hairs and reduced shedding appear within 60 to 90 days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hair Science & In-Depth Articles */}
        <div className="space-y-8 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#A84358] uppercase tracking-widest block mb-1">
                Herbal Knowledge Base
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold font-serif text-[#2D1B1B]">
                Ayurvedic Hair Science & Articles
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
                Read in-depth guides on Kshirapak slow-infusion methods, rosemary & bhringraj efficacy, and scalp wellness.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/hair-care-tips/${post.slug}`}
                className="bg-white rounded-3xl overflow-hidden border border-rose-100 shadow-xs hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col group"
              >
                <div className="relative aspect-16/9 bg-stone-900 overflow-hidden">
                  <Image
                    src={post.featuredImage || '/images/banners/banner-1.png'}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-[#A84358] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {post.category}
                  </span>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-4 text-xs text-stone-400 mb-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {post.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#2D1B1B] group-hover:text-[#A84358] transition-colors leading-tight">
                      {post.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 mt-2.5 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-rose-100 flex items-center justify-between text-xs font-bold text-[#A84358]">
                    <span>Read Full Guide & Article</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
