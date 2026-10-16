import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LazyImage from '@/components/ui/LazyImage';
import { ArrowRight } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

interface CategoryGridProps {
  categories: CategoryItem[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="py-7 sm:py-16 bg-stone-50/70 border-y border-stone-200/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-10">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-3 py-1 rounded-full">
            Ayurvedic Catalog
          </span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 mt-2 font-serif">
            Shop By Hair Solution
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-lg mx-auto">
            Targeted herbal treatments designed for intensive nourishment, regrowth, and hair shaft repair.
          </p>
        </div>

        {/* Mobile & Tablet: horizontal scroll track; Desktop: 4-col grid */}
        <div className="flex lg:grid overflow-x-auto lg:overflow-visible gap-2.5 sm:gap-4 lg:gap-6 no-scrollbar pb-2 lg:pb-0 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="w-[140px] sm:w-[220px] lg:w-auto shrink-0 lg:shrink snap-start group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-rose-950/10 hover:border-rose-600/40 hover:shadow-xl hover:shadow-rose-950/10 transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-4/3 sm:aspect-square overflow-hidden bg-stone-100">
                <LazyImage
                  src={cat.image || '/images/banners/banner-1.png'}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 140px, (max-width: 1024px) 220px, 25vw"
                  className="object-cover group-hover:scale-108 transition-transform duration-500"
                  wrapperClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <h3 className="text-xs sm:text-base font-bold drop-shadow-sm flex items-center justify-between">
                    <span>{cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 hidden sm:inline opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </h3>
                  {cat.description && (
                    <p className="hidden sm:block text-[11px] text-rose-100/90 line-clamp-1 mt-0.5">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
