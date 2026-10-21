import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Transformations & Hair Wellness Results | Herbic Cure',
  description:
    'Explore real hair wellness routines, scalp nourishment results, and customer feedback with Herbic Cure 21 herbs formulations.',
  alternates: {
    canonical: '/results',
  },
};

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, ArrowRight } from 'lucide-react';

import { normalizeImageUrl } from '@/lib/utils';

export const revalidate = 60;

function getProductLink(title?: string | null): string {
  if (!title) return '/products';
  const lower = title.toLowerCase();
  if (lower.includes('kit') || lower.includes('comb')) {
    return '/products/herbic-cure-complete-hair-therapy-kit';
  }
  if (lower.includes('shampoo')) {
    return '/products/herbic-cure-shampoo-with-conditioner-q1';
  }
  if (lower.includes('oil') || lower.includes('21 herbs')) {
    return '/products/herbic-cure-21-herbs-fusion-hair-oil-q2';
  }
  return '/products';
}

export default async function ResultsPage() {
  let results: any[] = [];
  try {
    results = await prisma.customerResult.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
    });
  } catch (err) {
    console.warn('Results query deferred during build/ISR:', (err as any)?.message || String(err));
  }

  return (
    <div className="bg-[#FCF8F9] min-h-screen py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-3 py-1 rounded-full mb-2.5 sm:mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Customer Case Studies</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-extrabold text-stone-900 font-serif">
            Real Transformations, Real Regrowth
          </h1>
          <p className="text-xs sm:text-base text-stone-600 mt-2 sm:mt-3 leading-relaxed">
            See the transformative difference 21 South Indian Ayurvedic herbs make on hair density, crown thinning, and postpartum shedding.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {results.map((r) => {
            const beforeSrc = normalizeImageUrl(r.beforeImage);
            const afterSrc = normalizeImageUrl(r.afterImage) || '/images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg';
            const productHref = getProductLink(r.productTitle);

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200 shadow-xs sm:shadow-sm flex flex-col justify-between hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-2 gap-1 bg-stone-200 p-0.5 sm:p-1">
                  {beforeSrc && (
                    <div className="relative w-full aspect-4/5 rounded-l-xl sm:rounded-l-2xl overflow-hidden bg-stone-300">
                      <Image
                        src={beforeSrc}
                        alt={`${r.customerName} Before`}
                        fill
                        unoptimized={beforeSrc.includes('googleusercontent.com') || beforeSrc.includes('drive.google.com')}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                        className="object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-stone-900/80 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wide">
                        Before
                      </span>
                    </div>
                  )}
                  <div
                    className={`relative w-full aspect-4/5 rounded-r-xl sm:rounded-r-2xl overflow-hidden bg-stone-300 ${
                      !beforeSrc ? 'col-span-2' : ''
                    }`}
                  >
                    <Image
                      src={afterSrc}
                      alt={`${r.customerName} After`}
                      fill
                      unoptimized={afterSrc.includes('googleusercontent.com') || afterSrc.includes('drive.google.com')}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                      className="object-cover"
                    />
                    <span className="absolute top-1.5 right-1.5 bg-rose-700 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wide">
                      After
                    </span>
                  </div>
                </div>

                <div className="p-2.5 sm:p-5 lg:p-6 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-4">
                  <div>
                    <div className="mb-1">
                      <h3 className="font-bold text-stone-900 text-xs sm:text-sm truncate">{r.customerName}</h3>
                    </div>

                    {r.productTitle && (
                      <Link
                        href={productHref}
                        className="text-[10px] sm:text-xs font-semibold text-[#A84358] hover:underline truncate block"
                      >
                        {r.productTitle}
                      </Link>
                    )}

                    <p className="text-[11px] sm:text-sm text-stone-600 italic mt-1.5 leading-snug line-clamp-3">
                      &ldquo;{r.caption}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 sm:pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-rose-700 font-bold truncate">Verified Review</span>
                    <Link
                      href={productHref}
                      className="font-bold text-[#A84358] hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Shop</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
