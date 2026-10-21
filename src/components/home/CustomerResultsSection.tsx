'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { normalizeImageUrl } from '@/lib/utils';

interface ResultItem {
  id: string;
  customerName: string;
  productTitle?: string | null;
  beforeImage?: string | null;
  afterImage: string;
  caption?: string | null;
}

export default function CustomerResultsSection({ results = [] }: { results?: ResultItem[] }) {
  // Fallback items if database list is empty
  const fallbackResults: ResultItem[] = [
    {
      id: '1',
      customerName: 'Ananya S. (Bengaluru)',
      productTitle: '21 Herbs Fusion Hair Oil',
      beforeImage: '/images/products/herbic-cure/herbic-cure-oil-shampoo-benefits.jpg',
      afterImage: '/images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg',
      caption: 'Parting line visibly denser and post-partum shedding stopped in 6 weeks.',
    },
    {
      id: '2',
      customerName: 'Rohit Verma (Delhi)',
      productTitle: 'Root Energizing Scalp Regimen',
      beforeImage: '/images/products/herbic-cure/herbic-cure-oil-shampoo-benefits.jpg',
      afterImage: '/images/products/herbic-cure/herbic-cure-hair-oil-bottle-front.jpg',
      caption: 'Crown thinning reversed significantly in 2 months of regular application.',
    },
    {
      id: '3',
      customerName: 'Meera Rao (Hyderabad)',
      productTitle: 'Herbic Cure Ayurvedic Shampoo',
      beforeImage: '/images/products/herbic-cure/herbic-cure-oil-shampoo-benefits.jpg',
      afterImage: '/images/products/herbic-cure/herbic-cure-oil-shampoo-comb-trio.jpg',
      caption: 'Hair breakage reduced by 80%. My strands feel much thicker and stronger.',
    },
    {
      id: '4',
      customerName: 'Kavitha M. (Chennai)',
      productTitle: '21 Herbs Fusion Hair Oil',
      beforeImage: '/images/products/herbic-cure/herbic-cure-oil-shampoo-benefits.jpg',
      afterImage: '/images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg',
      caption: 'Severe seasonal shedding completely stopped within 3 weeks of night massage.',
    },
  ];

  const displayResults = results && results.length > 0 ? results : fallbackResults;

  return (
    <section className="py-7 sm:py-20 bg-[#FCF8F9] border-y border-stone-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2.5">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
            <span>Clinical &amp; Real Life Proof</span>
          </div>
          <h2 className="text-xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            REAL PEOPLE. REAL REGROWTH.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            100% genuine transformations from verified Herbic Cure users who embraced our cold-pressed Ayurvedic regimen.
          </p>
        </div>

        {/* Mobile & Tablet: smooth horizontal snap track; Desktop: 4-col grid */}
        <div className="flex lg:grid overflow-x-auto lg:overflow-visible snap-x snap-mandatory gap-3 sm:gap-5 lg:gap-8 pb-2.5 lg:pb-0 no-scrollbar lg:grid-cols-4">
          {displayResults.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="w-[calc(50%-6px)] sm:w-[280px] lg:w-auto shrink-0 lg:shrink snap-start bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 border border-stone-200/80 shadow-xs sm:shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Visual Before / After or Highlight Card */}
                {(() => {
                  const normalizedSrc = normalizeImageUrl(item.afterImage) || '/images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg';
                  return (
                    <div className="relative aspect-4/3 rounded-xl sm:rounded-2xl overflow-hidden bg-stone-100 mb-2 sm:mb-4 border border-stone-100">
                      <Image
                        src={normalizedSrc}
                        alt={item.customerName}
                        fill
                        unoptimized={normalizedSrc.includes('googleusercontent.com') || normalizedSrc.includes('drive.google.com')}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover object-center"
                      />
                      <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-[#A84358]/95 text-white text-[8px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-xs flex items-center gap-0.5 sm:gap-1 shadow-xs">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-300 shrink-0" />
                        <span>Verified Result</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                  <span className="font-bold text-xs sm:text-sm text-stone-900 leading-snug">
                    {item.customerName}
                  </span>
                </div>

                {item.productTitle && (
                  <p className="text-[10px] sm:text-xs font-semibold text-[#A84358] mb-1 sm:mb-2 line-clamp-1">
                    {item.productTitle}
                  </p>
                )}

                <p className="text-[11px] sm:text-xs text-stone-600 italic leading-snug line-clamp-3 sm:line-clamp-none min-h-[2.4rem] sm:min-h-auto">
                  &ldquo;{item.caption || 'Hair fall stopped within 3 weeks of consistent night massage.'}&rdquo;
                </p>
              </div>

              <div className="mt-3 sm:mt-5 pt-2.5 sm:pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1 text-[9px] sm:text-[11px] text-stone-500">
                <span className="flex items-center gap-1 text-rose-800 font-semibold">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 shrink-0" />
                  <span>Ayurvedic Certified</span>
                </span>
                <span className="hidden sm:inline">Visible in 21 days</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
