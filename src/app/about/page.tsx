import type { Metadata } from 'next';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Heart, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Heritage & Ayurvedic Science | Herbic Cure',
  description:
    'Discover how Herbic Cure revives ancient Kshirapak Vidhi using 21 rare Himalayan herbs for deep root nourishment.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FCF8F9]">
      {/* Hero Header */}
      <section className="relative py-20 bg-[#f4ebe1] border-b border-stone-200/80 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-4">
            Our Ancient Heritage
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 font-serif leading-tight">
            Inspired by Himalayan Herbs. Crafted by Ayurveda.
          </h1>
          <p className="text-base sm:text-lg text-stone-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            At Herbic Cure, we believe true hair transformation begins at the follicle. We combine 21 authentic botanical herbs with cold-pressed oils through time-honored slow boiling.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative w-full aspect-4/3 rounded-3xl overflow-hidden shadow-xl border border-stone-200">
            <Image
              src="/images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg"
              alt="Herbic Cure Ayurvedic Tradition"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A84358]">
              The Kshirapak Vidhi Method
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif">
              Why Cold Infusion Makes All The Difference
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Unlike commercial cosmetic oils diluted with mineral oil and synthetic silicones, every batch of Herbic Cure hair elixir is slowly prepared over 72 hours. Fresh herbal extracts of Bhringraj, Brahmi, Jatamansi, and Amla are infused into cold-pressed virgin coconut and sesame oils.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80">
                <CheckCircle2 className="w-5 h-5 text-[#A84358] mb-2" />
                <h4 className="text-xs font-bold text-stone-900">Zero Mineral Oil</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">100% pure botanical base</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80">
                <CheckCircle2 className="w-5 h-5 text-[#A84358] mb-2" />
                <h4 className="text-xs font-bold text-stone-900">21 Herbs Infusion</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">Root-deep nourishment</p>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-[#A84358] hover:bg-[#45363B] text-white text-xs font-bold px-6 py-3.5 rounded-full transition-all shadow-md"
              >
                <span>Explore Formulations</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
