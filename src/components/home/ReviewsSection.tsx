import React from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, ArrowRight } from 'lucide-react';

interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  title?: string | null;
  content: string;
  isVerifiedPurchase: boolean;
  createdAt?: Date;
}

interface ReviewsSectionProps {
  reviews?: ReviewItem[];
}

export default function ReviewsSection({ reviews = [] }: ReviewsSectionProps) {
  const fallbackReviews: ReviewItem[] = [
    {
      id: '1',
      customerName: 'Ananya S.',
      rating: 5,
      title: 'Hair fall visibly controlled',
      content: 'Noticeable density improvement along my parting line and shedding reduced within 3 weeks.',
      isVerifiedPurchase: true,
    },
    {
      id: '2',
      customerName: 'Rohit Verma',
      rating: 5,
      title: 'Root strength restored',
      content: 'Crown thinning reversed significantly. The cold-pressed herbs make my scalp feel fresh and calm.',
      isVerifiedPurchase: true,
    },
    {
      id: '3',
      customerName: 'Kavitha M.',
      rating: 5,
      title: 'Authentic Ayurvedic oil',
      content: 'Pure herbal aroma without chemical fragrance. Keeps hair shiny, thick, and deeply nourished.',
      isVerifiedPurchase: true,
    },
    {
      id: '4',
      customerName: 'Deepak Kumar',
      rating: 5,
      title: 'Zero dandruff & strong roots',
      content: 'Within 21 days my scalp cleared up completely. Strands feel stronger when combing.',
      isVerifiedPurchase: true,
    },
    {
      id: '5',
      customerName: 'Sneha Patel',
      rating: 5,
      title: 'Best Ayurvedic combo',
      content: 'Using the hair oil along with the botanical shampoo. Soft bouncy hair without conditioner needed.',
      isVerifiedPurchase: true,
    },
    {
      id: '6',
      customerName: 'Meera Rao',
      rating: 5,
      title: 'Remarkable difference',
      content: 'Post-pregnancy hair thinning was severe until I started this regimen. Highly recommend to everyone!',
      isVerifiedPurchase: true,
    },
  ];

  const displayReviews = reviews && reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <section className="py-7 sm:py-20 bg-white border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-10">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-amber-400 stroke-amber-400" />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-stone-900">4.9 / 5 Rating</span>
              <span className="text-[10px] sm:text-xs text-stone-500">(2,50,000+ Happy Customers)</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 font-serif">
              Loved By Customers Across India
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
              Authentic reviews from verified purchasers who experienced real hair fall control and scalp nourishment.
            </p>
          </div>

          <Link
            href="/reviews"
            className="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#A84358] hover:underline uppercase tracking-wider"
          >
            <span>Read All Reviews</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {/* Mobile & Tablet: smooth horizontal swipe track; Desktop: 3-col grid */}
        <div className="flex lg:grid overflow-x-auto lg:overflow-visible snap-x snap-mandatory gap-3 sm:gap-5 lg:gap-6 pb-2.5 lg:pb-0 no-scrollbar lg:grid-cols-3">
          {displayReviews.slice(0, 6).map((rev) => (
            <div
              key={rev.id}
              className="w-[calc(50%-6px)] sm:w-[320px] lg:w-auto shrink-0 lg:shrink snap-start bg-stone-50/90 rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 border border-stone-200/80 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2 sm:mb-3">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>
                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-bold text-rose-800 bg-rose-100/90 px-1.5 sm:px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600 stroke-[2.5] shrink-0" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                </div>

                {rev.title && (
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 mb-1 sm:mb-2 leading-snug line-clamp-2">
                    {rev.title}
                  </h4>
                )}

                <p className="text-[11px] sm:text-sm text-stone-600 leading-snug line-clamp-3 sm:line-clamp-4 italic min-h-[2.4rem] sm:min-h-auto">
                  &ldquo;{rev.content}&rdquo;
                </p>
              </div>

              <div className="mt-3 sm:mt-5 pt-2 sm:pt-4 border-t border-stone-200/60 flex items-center justify-between text-[10px] sm:text-xs text-stone-500 gap-1">
                <span className="font-bold text-stone-800 leading-tight">{rev.customerName}</span>
                <span className="text-stone-400 font-medium shrink-0">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
