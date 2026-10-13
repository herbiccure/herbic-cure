import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Star, CheckCircle2 } from 'lucide-react';
import WriteReviewModal from '@/components/review/WriteReviewModal';

export const metadata: Metadata = {
  title: 'Customer Reviews & Real Feedback | Herbic Cure',
  description: 'Read verified testimonials and reviews from over 2,50,000 customers using Herbic Cure 21 herbs formulations.',
  alternates: {
    canonical: '/reviews',
  },
};

export default async function ReviewsPage() {
  const [reviews, products] = await Promise.all([
    prisma.review.findMany({
      where: { isApproved: true },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    }),
  ]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.9';

  return (
    <div className="min-h-screen bg-[#FCF8F9] py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-2.5 sm:mb-3 inline-block">
            Verified Experiences
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            LOVED BY OVER 2,50,000+ CUSTOMERS
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 stroke-amber-400" />
              ))}
            </div>
            <span className="text-xs sm:text-sm font-bold text-stone-800">{avgRating} out of 5 Average Rating</span>
            <span className="text-[10px] sm:text-xs text-stone-500">({reviews.length} verified reviews)</span>
          </div>

          <div className="mt-4 sm:mt-6 flex justify-center">
            <WriteReviewModal products={products} />
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-stone-200 max-w-md mx-auto shadow-xs">
            <h3 className="text-base font-bold text-stone-800">No reviews published yet</h3>
            <p className="text-xs text-stone-500 mt-1 mb-6">
              Be the first to share your experience with South India’s premier 21 Ayurvedic herbs formulation.
            </p>
            <WriteReviewModal products={products} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-2.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs sm:shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2 sm:mb-3">
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600 shrink-0" />
                      <span className="truncate">Verified Buyer</span>
                    </span>
                  </div>

                  {rev.product && (
                    <Link
                      href={`/products/${rev.product.slug}`}
                      className="inline-block text-[10px] sm:text-[11px] font-semibold text-[#A84358] hover:underline bg-rose-50/80 px-2 py-0.5 rounded-full mb-1.5 sm:mb-2 truncate max-w-full"
                    >
                      {rev.product.name}
                    </Link>
                  )}

                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 mb-1 leading-snug line-clamp-1 sm:line-clamp-2">{rev.title}</h4>
                  <p className="text-[11px] sm:text-xs text-stone-600 leading-snug italic line-clamp-3 sm:line-clamp-4 min-h-[2.4rem] sm:min-h-auto">
                    &ldquo;{rev.content}&rdquo;
                  </p>
                </div>

                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs text-stone-500 gap-1">
                  <span className="font-semibold text-stone-800 truncate max-w-[65%]">{rev.customerName}</span>
                  <span className="text-stone-400 truncate shrink-0">{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
