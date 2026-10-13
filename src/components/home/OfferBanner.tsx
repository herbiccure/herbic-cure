'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';

interface OfferBannerProps {
  badge?: string;
  heading?: string;
  description?: string;
  couponCode?: string;
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
}

export default function OfferBanner({
  badge = 'SPECIAL AYURVEDIC OFFER',
  heading = 'Save Flat 10% On All Herbal Orders',
  description = 'Stop hair fall with pure South Indian herbs. Use code at checkout for instant savings plus free express shipping above ₹499.',
  couponCode = 'HERBIC10',
  ctaText = 'CLAIM OFFER NOW',
  ctaUrl = '/products',
  image = '/images/banners/herbic-hero-banner-2.jpg',
}: OfferBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2D1B1B] to-[#A84358] text-white shadow-2xl border border-rose-800/40">
          {/* Background image tint */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-25 md:opacity-40 pointer-events-none mix-blend-overlay">
            <Image
              src={image}
              alt="Herbal Offer"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>

          <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-2xl flex flex-col items-start space-y-5">
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-stone-950 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{badge}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-serif leading-tight">
              {heading}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-rose-100/90 leading-relaxed max-w-lg">
              {description}
            </p>

            {/* Coupon Code Block */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center bg-stone-950/60 backdrop-blur-md border border-amber-400/40 rounded-xl px-4 py-2.5">
                <Tag className="w-4 h-4 text-amber-400 mr-2" />
                <span className="font-mono font-bold tracking-widest text-amber-300 text-sm sm:text-base mr-3">
                  {couponCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-xs text-amber-200 hover:text-white rounded bg-rose-900/60 hover:bg-rose-800 transition-colors flex items-center gap-1 font-semibold"
                  title="Copy coupon code"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-rose-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <Link
                href={ctaUrl}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 shadow-lg shadow-amber-950/20 active:scale-95"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
