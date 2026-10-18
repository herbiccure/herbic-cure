'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, Check, Sparkles, ArrowRight } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  benefits?: string | null;
  displayOrder: number;
}

interface IngredientsShowcaseSectionProps {
  title?: string;
  subtitle?: string;
  contentJson?: string;
}

export default function IngredientsShowcaseSection({
  title = 'THE 21 SACRED AYURVEDIC HERBS',
  subtitle = 'Every bottle of Herbic Cure is slow-infused with 21 medicinal botanicals harvested at peak potency from Himalayan foothills and organic South Indian farms.',
  contentJson,
}: IngredientsShowcaseSectionProps) {
  const [herbs, setHerbs] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  let parsedConfig: any = {};
  try {
    if (contentJson) parsedConfig = JSON.parse(contentJson);
  } catch {}

  const displayTitle = parsedConfig.title || title;
  const displaySubtitle = parsedConfig.subtitle || subtitle;
  const displayBadge = parsedConfig.badge || 'Botanical Alchemy';
  const maxDisplay = parsedConfig.maxDisplay || 6;

  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/ingredients')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.ingredients)) {
          setHerbs(data.ingredients.filter((i: any) => i.active));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedHerbs = herbs.slice(0, maxDisplay);

  return (
    <section className="py-12 sm:py-20 bg-[#FCF8F9] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{displayBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            {displayTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-xl mx-auto leading-relaxed">
            {displaySubtitle}
          </p>
        </div>

        {/* Herbs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {displayedHerbs.map((herb, idx) => (
            <div
              key={herb.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100/70 text-[#A84358] border border-rose-200/50 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {herb.image ? (
                      <Image
                        src={herb.image}
                        alt={herb.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Leaf className="w-4 h-4 text-[#A84358]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                      {herb.name}
                    </h3>
                    <span className="inline-block bg-rose-50 text-rose-800 border border-rose-200/60 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider mt-0.5">
                      Herb #{idx + 1}
                    </span>
                  </div>
                </div>

                {herb.shortDescription && (
                  <p className="text-[11px] font-bold text-[#A84358] mb-1.5 leading-snug">
                    {herb.shortDescription}
                  </p>
                )}

                {herb.fullDescription && (
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-3">
                    {herb.fullDescription}
                  </p>
                )}
              </div>

              {herb.benefits && (
                <div className="mt-auto pt-3 border-t border-stone-100 flex items-start gap-2 text-[11px] text-stone-700">
                  <Check className="w-3.5 h-3.5 text-rose-600 stroke-[3] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    <strong className="text-[#A84358] mr-1">Action:</strong>
                    {herb.benefits}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA to Full 21 Herbs Catalog */}
        <div className="text-center mt-10">
          <Link
            href="/ingredients"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#A84358] hover:bg-[#8C3A4F] text-white text-xs font-bold rounded-full transition-all shadow-md hover:shadow-lg active:scale-98"
          >
            <span>Explore All 21 Sacred Botanicals in Detail</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
