import type { Metadata } from 'next';
import React from 'react';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Leaf, Check, Sparkles } from 'lucide-react';
import HerbImageBadge from '@/components/ui/HerbImageBadge';

export const revalidate = 600;


export const metadata: Metadata = {
  title: 'The 21 Rare Himalayan Herbs | Herbic Cure Formulation',
  description: 'Explore the 21 medicinal Ayurvedic herbs infused into Herbic Cure hair elixirs.',
  alternates: {
    canonical: '/ingredients',
  },
};

export default async function IngredientsPage() {
  let ingredients: any[] = [];
  try {
    ingredients = await prisma.ingredient.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
    });
  } catch (err) {
    console.warn('Could not fetch ingredients at build/render time:', err);
  }

  return (
    <div className="min-h-screen bg-[#FCF8F9] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-3 inline-block">
            Botanical Alchemy
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 font-serif">
            THE 21 SACRED AYURVEDIC HERBS
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
            Every bottle of Herbic Cure is slow-infused with 21 medicinal botanicals harvested at peak potency from Himalayan foothills and organic South Indian farms.
          </p>
        </div>

        {/* 21 Herbs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ingredients.map((herb, idx) => (
            <div
              key={herb.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
            >
              <div>
                {/* Herb Badge & Title */}
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="relative w-12 h-12 rounded-2xl bg-rose-100/70 text-[#A84358] border border-rose-200/50 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    <HerbImageBadge src={herb.image} alt={herb.name} size="md" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                      {herb.name}
                    </h3>
                    <span className="inline-block bg-rose-50 text-rose-800 border border-rose-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      Herb #{herb.displayOrder || idx + 1}
                    </span>
                  </div>
                </div>

                {/* Ayurvedic Subtitle / Title */}
                {herb.shortDescription && (
                  <p className="text-xs font-bold text-[#A84358] mb-2 leading-snug">
                    {herb.shortDescription}
                  </p>
                )}

                {/* Full Mechanism Description */}
                {herb.fullDescription && (
                  <p className="text-xs text-stone-600 leading-relaxed mb-4">
                    {herb.fullDescription}
                  </p>
                )}
              </div>

              {/* Complete Key Benefits (No Truncation) */}
              {herb.benefits && (
                <div className="mt-auto pt-4 border-t border-stone-100 flex items-start gap-2.5 text-xs text-stone-700">
                  <div className="w-5 h-5 rounded-full bg-rose-100/80 text-[#A84358] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="flex-1 leading-relaxed">
                    <span className="font-bold text-[#A84358] mr-1.5">Action:</span>
                    <span className="font-medium text-stone-800">{herb.benefits}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
