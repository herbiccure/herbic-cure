'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShoppingBag,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

const COMBO_PRODUCT = {
  id: '5a029157-5a5e-4a46-a563-78a8de220a17',
  name: 'Herbic Cure - 21 Herbs Fusion Hair Oil + Shampoo with Conditioner + Neem Wood Comb',
  slug: 'herbic-cure-complete-hair-therapy-kit',
  regularPrice: 1448,
  salePrice: 1158,
  image: '/images/products/herbic-cure/herbic-cure-oil-shampoo-comb-trio.jpg',
};

export default function DiscoverHerbicas() {
  const router = useRouter();
  const { addItem, setIsCartOpen } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem({
      id: COMBO_PRODUCT.id,
      name: COMBO_PRODUCT.name,
      slug: COMBO_PRODUCT.slug,
      price: COMBO_PRODUCT.salePrice,
      regularPrice: COMBO_PRODUCT.regularPrice,
      image: COMBO_PRODUCT.image,
    });
    toast.success('Complete 3-in-1 Hair Therapy Kit added to bag!');
    setIsCartOpen(true);
    setTimeout(() => setIsAdding(false), 800);
  };

  const handleBuyNow = () => {
    setIsBuying(true);
    addItem({
      id: COMBO_PRODUCT.id,
      name: COMBO_PRODUCT.name,
      slug: COMBO_PRODUCT.slug,
      price: COMBO_PRODUCT.salePrice,
      regularPrice: COMBO_PRODUCT.regularPrice,
      image: COMBO_PRODUCT.image,
    });
    router.push('/checkout');
  };

  const ritualSteps = [
    {
      step: '01',
      title: '21 Herbs Fusion Hair Oil (190ml)',
      desc: 'Infused with 21 Ayurvedic herbs & roots. Nourishes dormant follicles and controls hair fall from root.',
      tag: 'Pre-Wash Care',
    },
    {
      step: '02',
      title: 'Shampoo with Conditioner (200ml)',
      desc: 'Enriched with Neem, Tulsi & Argan Oil. Gently cleanses buildup without stripping natural scalp moisture.',
      tag: 'Gentle Wash',
    },
    {
      step: '03',
      title: 'Handcrafted Neem Wood Comb',
      desc: 'Anti-static wide teeth comb. Stimulates scalp micro-circulation and prevents mechanical breakage.',
      tag: 'Scalp Activation',
    },
  ];

  return (
    <section className="py-8 sm:py-20 bg-white border-t border-stone-200/60 relative overflow-hidden">
      {/* Decorative subtle ambient blush glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-center">
          {/* Left: Product Shot */}
          <div className="lg:col-span-6 relative">
            <div className="relative w-full aspect-16/10 sm:aspect-4/3 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-rose-950/10 group">
              <Image
                src="/images/products/herbic-cure/herbic-cure-oil-shampoo-comb-trio.jpg"
                alt="Herbic Cure 3-in-1 Ayurvedic Hair Therapy Kit - Oil, Shampoo and Neem Comb"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />

              {/* Top Discount Badge */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 bg-[#A84358] text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-md">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>SAVE 20% OFF COMBO</span>
              </div>

              {/* Bottom Overlay Info */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 text-white pointer-events-none">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
                  Complete 3-Step Ayurvedic Regrowth Routine
                </span>
                <p className="text-xs sm:text-sm font-semibold text-rose-50 leading-tight">
                  21 Herbs Fusion Oil + Herbal Shampoo + Pure Neem Wood Comb
                </p>
              </div>
            </div>

            {/* Floating Trust Card */}
            <div className="hidden sm:flex absolute -bottom-5 -right-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-rose-900/10 items-center gap-3.5 z-20">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-[#A84358] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">100% Ayurvedic Therapy</p>
                <p className="text-[10px] text-gray-500 font-medium">Paraben, Sulphate &amp; Mineral Oil Free</p>
              </div>
            </div>
          </div>

          {/* Right: Content, Pricing & Instant Checkout */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-rose-100 text-[#A84358] px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#A84358]" />
              <span>THE ULTIMATE 3-IN-1 HAIR CARE COMBO</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif leading-tight">
                Complete Hair Therapy Kit
              </h2>
              <p className="text-[11px] sm:text-sm text-[#A84358] font-bold mt-1 uppercase tracking-wider">
                21 Herbs Oil (190ml) + Herbal Shampoo (200ml) + Neem Wood Comb
              </p>
            </div>

            {/* Rating Strip */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-0.5 sm:gap-1 text-amber-500">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-stone-900">4.9 / 5</span>
              <span className="text-xs text-stone-400">|</span>
              <span className="text-xs text-stone-500 font-medium">1,480+ Verified Results</span>
            </div>

            {/* Live Pricing Box */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FCF8F9] border border-stone-200/80 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  Combo Special Price
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
                    ₹{COMBO_PRODUCT.salePrice}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-stone-400 line-through">
                    ₹{COMBO_PRODUCT.regularPrice}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-rose-100 text-[#A84358] text-[10px] sm:text-[11px] font-bold">
                    Save ₹{COMBO_PRODUCT.regularPrice - COMBO_PRODUCT.salePrice} (20% OFF)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 sm:py-1 rounded-full border border-emerald-200">
                  <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Free Express Delivery
                </span>
              </div>
            </div>

            {/* 3 Steps Overview - Horizontal swipe track on Mobile & Tablet, vertical on Desktop */}
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2.5 lg:space-y-2.5 no-scrollbar pb-1 lg:pb-0">
              {ritualSteps.map((item) => (
                <div
                  key={item.step}
                  className="w-[230px] sm:w-[280px] lg:w-auto shrink-0 lg:shrink flex items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl bg-white border border-stone-200/70 hover:border-rose-200 transition-colors shadow-2xs"
                >
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-rose-100 text-[#A84358] text-[10px] sm:text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                    {item.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-[11px] sm:text-xs font-bold text-stone-900 leading-tight">{item.title}</h4>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-[#A84358] bg-rose-50 px-1.5 py-0.5 rounded-xs shrink-0">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 leading-snug line-clamp-2 lg:line-clamp-none">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons: 2 buttons side-by-side on Mobile & Tablet */}
            <div className="space-y-2.5 pt-1 sm:pt-2">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Buy Now Primary CTA */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isBuying}
                  className="w-full py-3 sm:py-3.5 px-3 sm:px-6 rounded-xl bg-[#A84358] hover:bg-[#8C374A] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-rose-900/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
                  <span>{isBuying ? '...' : 'BUY NOW • ₹1,158'}</span>
                </button>

                {/* Add to Bag Secondary CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full py-3 sm:py-3.5 px-3 sm:px-6 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#A84358] border-2 border-[#EAC9D1] hover:border-[#A84358] text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 active:scale-98 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{isAdding ? '...' : 'ADD TO BAG'}</span>
                </button>
              </div>

              {/* View Full Product Link */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs pt-1">
                <Link
                  href={`/products/${COMBO_PRODUCT.slug}`}
                  className="inline-flex items-center gap-1 font-bold text-[#A84358] hover:underline"
                >
                  <span>Product Specs</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Link>

                <span className="text-[10px] sm:text-[11px] text-stone-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                  COD Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
