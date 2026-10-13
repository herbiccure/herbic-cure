'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

interface Slide {
  desktopImage: string;
  mobileImage?: string;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

interface HeroSliderProps {
  slides?: Slide[];
}

const defaultSlides: Slide[] = [
  {
    desktopImage: '/images/banners/herbic-hero-banner-1.jpg',
    mobileImage: '/images/banners/herbic-hero-banner-1.jpg',
    heading: 'Herbic Cure - 21 Herbs Fusion Hair Oil',
    subheading: 'Ancient Ayurveda for Modern Strength. Nature In Every Drop: 100% Herbal infusion of 21 roots and botanical extracts to stop hair fall.',
    ctaText: 'SHOP INTRODUCTORY OFFER (33% OFF)',
    ctaUrl: '/products/herbic-cure-21-herbs-fusion-hair-oil-q1',
    secondaryCtaText: 'VIEW 21 HERBS',
    secondaryCtaUrl: '/ingredients',
  },
  {
    desktopImage: '/images/banners/herbic-hero-banner-2.jpg',
    mobileImage: '/images/banners/herbic-hero-banner-2.jpg',
    heading: 'Complete Hair Therapy Ritual Kits',
    subheading: 'Stop hair fall, cleanse gently, and detangle with 21 Herbs Hair Oil, Shampoo with Conditioner & Handcrafted Neem Wood Comb.',
    ctaText: 'EXPLORE KITS & COMBOS',
    ctaUrl: '/collections/combos',
    secondaryCtaText: 'ORDER ON WHATSAPP',
    secondaryCtaUrl: 'https://wa.me/918121961219',
  },
];

export default function HeroSlider({ slides = defaultSlides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full overflow-hidden bg-stone-950 min-h-[500px] sm:min-h-[560px] md:min-h-[620px] lg:min-h-[680px] flex items-center">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={slide.desktopImage}
              alt={slide.heading}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-center transform scale-100 transition-transform duration-10000"
            />
            {/* Dark & Forest Green Vignette Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-stone-950/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/30" />
          </div>

          {/* Content Container */}
          <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-center w-full text-white">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#A84358]/90 backdrop-blur-md text-rose-200 border border-rose-500/40 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 w-fit shadow-lg shadow-rose-950/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Authentic Ayurvedic Kshirapak Vidhi</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-[1.1] mb-4 text-white drop-shadow-md">
              {slide.heading}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-rose-100/90 font-medium mb-8 max-w-xl leading-relaxed drop-shadow-xs">
              {slide.subheading}
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href={slide.ctaUrl}
                className="px-6 sm:px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 shadow-xl shadow-amber-950/20 flex items-center gap-2 active:scale-95"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {slide.secondaryCtaText && slide.secondaryCtaUrl && (
                <Link
                  href={slide.secondaryCtaUrl}
                  className="px-6 sm:px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/30 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 active:scale-95"
                >
                  {slide.secondaryCtaText}
                </Link>
              )}
            </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 z-30 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all border border-white/10 hover:scale-105"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 z-30 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all border border-white/10 hover:scale-105"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-5 inset-x-0 z-30 flex justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === current ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
