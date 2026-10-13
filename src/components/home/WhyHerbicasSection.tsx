'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export default function WhyHerbicasSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  const comparison = [
    {
      feature: 'Ingredients',
      herbicCure: 'Infused with 21+ Herbs, Roots & Floral Extracts',
      others: 'Made with Mineral Oil & Synthetic Ingredients',
    },
    {
      feature: 'Formulation',
      herbicCure: 'Ayurvedic Principles & 72hr Slow Kshirapak Method',
      others: 'Chemical-Based Industrial Formulation',
    },
    {
      feature: 'Hair Benefits',
      herbicCure: 'Deeply Nourishes Scalp & Hair from Root to Tip',
      others: 'Temporary Surface Coating without Follicle Feeding',
    },
    {
      feature: 'Texture & Feel',
      herbicCure: 'Lightweight, Non-Sticky & Easily Absorbed',
      others: 'Heavy, Greasy, Heavy Buildup & Difficult to Wash',
    },
    {
      feature: 'Safety & Purity',
      herbicCure: 'Zero Mineral Oil, Paraben-Free, Zero Harsh Chemicals',
      others: 'Contains Petroleum Mineral Oils & Artificial Perfumes',
    },
    {
      feature: 'Suitability',
      herbicCure: 'Suitable for All Hair Types & Daily/Overnight Use',
      others: 'May Clog Pores & Cause Scalp Buildup',
    },
    {
      feature: 'Inspiration',
      herbicCure: 'Inspired by Pure Himalayan Herbs & Ancient Ayurveda',
      others: 'Generic Mass-Market Formulation without Tradition',
    },
  ];

  return (
    <section className="py-8 sm:py-20 bg-[#FCF8F9] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2.5">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
            <span>The Herbic Cure Standard</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 font-serif">
            Choose What&apos;s Best For Your Hair
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl mx-auto">
            Natural Care • Visible Results • A Healthier You. See why thousands trust Herbic Cure over drugstore mineral oils.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center max-w-6xl mx-auto">
          {/* Official Infographic Card */}
          <div className="lg:col-span-5 relative w-full aspect-16/10 sm:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg sm:shadow-2xl border border-stone-200 group bg-white">
            <Image
              src="/images/products/herbic-cure/herbic-cure-oil-vs-local-comparison.jpg"
              alt="Herbic Cure vs Local Brand Oil Comparison"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Interactive Comparison Table */}
          <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-xl border border-stone-200/80">
            <div className="grid grid-cols-12 bg-stone-900 text-white p-3 sm:p-5 font-bold text-xs sm:text-sm">
              <div className="col-span-4 sm:col-span-3">Feature</div>
              <div className="col-span-4 sm:col-span-5 text-[#EAC9D1] flex items-center gap-1">
                <span>🌿 Herbic Cure</span>
              </div>
              <div className="col-span-4 sm:col-span-4 text-stone-400">Local Brand Oil</div>
            </div>

            <div className="divide-y divide-stone-100">
              {comparison.map((item, idx) => {
                // On mobile, show only top 4 rows unless expanded
                const isHiddenOnMobile = !isExpanded && idx >= 4;
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 p-2.5 sm:p-4 text-[11px] sm:text-[13px] items-center ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'
                    } ${isHiddenOnMobile ? 'hidden lg:grid' : 'grid'}`}
                  >
                    <div className="col-span-4 sm:col-span-3 font-bold text-stone-900">
                      {item.feature}
                    </div>
                    <div className="col-span-4 sm:col-span-5 font-semibold text-[#A84358] flex items-start gap-1 sm:gap-2 pr-1.5 sm:pr-2 leading-tight">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0 mt-0.5 stroke-[3]" />
                      <span>{item.herbicCure}</span>
                    </div>
                    <div className="col-span-4 sm:col-span-4 text-stone-500 flex items-start gap-1 sm:gap-2 leading-tight">
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{item.others}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Expand / Collapse Button */}
            <div className="p-2 sm:p-3 bg-stone-50 border-t border-stone-100 text-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A84358] hover:underline"
              >
                <span>{isExpanded ? 'Show Fewer Points' : 'View Full Comparison (3 More)'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
