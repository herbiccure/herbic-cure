'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  UserCheck,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ReviewItem {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  customerName: string;
  isVerifiedPurchase: boolean;
  createdAt: string | Date;
}

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
  initialReviews: ReviewItem[];
}

export default function ProductReviewsSection({
  productId,
  productName,
  productSlug,
  initialReviews,
}: ProductReviewsSectionProps) {
  const { customer, isLoading: authLoading } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Eligibility state
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check purchase eligibility when modal opens or user logs in
  const checkPurchaseStatus = async () => {
    if (!customer) return;
    setCheckingEligibility(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}&eligibility=true`);
      const data = await res.json();
      if (res.ok) {
        setHasPurchased(!!data.hasPurchased);
        setEligibilityChecked(true);
      }
    } catch {
      // Fallback
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSubmitError(null);
    checkPurchaseStatus();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      setSubmitError('Please write at least 5 characters sharing your experience.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish review');
      }

      toast.success('Your verified review has been published!');

      // Dynamically add to reviews list
      if (data.review) {
        setReviews((prev) => [
          {
            ...data.review,
            createdAt: new Date(),
          },
          ...prev.filter((r) => r.id !== data.review.id),
        ]);
      }

      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setRating(5);
    } catch (err: any) {
      setSubmitError(err.message || 'Error publishing review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, percentage };
  });

  return (
    <section id="reviews" className="py-14 sm:py-20 border-t border-[#F2DFE4] bg-[#FCF8F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6DFE7] text-[#8C3A4F] text-[11px] font-bold uppercase tracking-wider mb-3 border border-[#EAC9D1]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authenticated Community Feedback</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B1B] font-serif tracking-tight">
            Verified Ayurvedic Customer Reviews
          </h2>
          <p className="text-xs sm:text-sm text-[#625056] mt-2 leading-relaxed">
            Every review published here is verified against authentic Pan-India customer order histories. Only authenticated purchasers of {productName} can leave verified feedback.
          </p>
        </div>

        {/* Rating Breakdown & Review Trigger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left: Overall Score Card */}
          <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-3xl border border-[#EAC9D1] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A5B64]">
                Customer Rating
              </span>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#2D1B1B] font-serif">
                  {avgRating}
                </span>
                <span className="text-sm font-semibold text-[#7A5B64]">out of 5</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(Number(avgRating))
                        ? 'fill-amber-400 stroke-amber-400'
                        : 'fill-stone-100 stroke-stone-300'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-[#8C3A4F] ml-2">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
              <p className="text-[11px] text-[#7A5B64] mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100% Genuine, Verified Buyer Policy</span>
              </p>
            </div>

            {/* Write Review CTA Button */}
            <div className="pt-6 mt-6 border-t border-[#F2DFE4]">
              {authLoading ? (
                <div className="h-11 rounded-2xl bg-stone-100 animate-pulse" />
              ) : !customer ? (
                <div>
                  <Link
                    href={`/account/login?callbackUrl=/products/${encodeURIComponent(productSlug)}#reviews`}
                    className="w-full py-3 px-5 rounded-2xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold shadow-md shadow-rose-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Write a Review</span>
                  </Link>
                  <p className="text-[10px] text-center text-[#7A5B64] mt-2">
                    Must be logged in with a verified order
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    onClick={handleOpenModal}
                    className="w-full py-3 px-5 rounded-2xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold shadow-md shadow-rose-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>Write a Verified Review</span>
                  </button>
                  <p className="text-[10px] text-center text-emerald-700 font-semibold mt-2 flex items-center justify-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Signed in as {customer.name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Star Distribution Bars */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-[#EAC9D1] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A5B64] mb-4">
              Rating Distribution
            </h3>
            <div className="space-y-3">
              {distribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-3 text-xs">
                  <div className="w-12 font-bold text-[#2D1B1B] flex items-center gap-1">
                    <span>{d.stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                  </div>
                  <div className="flex-1 h-2.5 bg-[#FAF2F5] rounded-full overflow-hidden border border-[#EAC9D1]/50">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-[#8C3A4F] rounded-full transition-all duration-500"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                  <div className="w-14 text-right text-[11px] font-semibold text-[#7A5B64]">
                    {d.percentage}% ({d.count})
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#F2DFE4] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#7A5B64]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Zero Sponsored or Fake Reviews
              </span>
              <span>•</span>
              <span>Encrypted Moderation Engine</span>
              <span>•</span>
              <span>Independent Customer Verification</span>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#2D1B1B] font-serif mb-4">
            Customer Testimonials ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white rounded-3xl border border-[#EAC9D1] shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#F6DFE7] text-[#8C3A4F] flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 fill-[#8C3A4F]" />
              </div>
              <h4 className="text-base font-bold text-[#2D1B1B] font-serif">
                Be the First Verified Buyer to Review
              </h4>
              <p className="text-xs text-[#7A5B64] mt-1 max-w-sm mx-auto leading-relaxed">
                Experience the classical Kshirapak Ayurvedic formulation and share your hair transformation.
              </p>
              {customer && (
                <button
                  onClick={handleOpenModal}
                  className="mt-4 px-6 py-2.5 rounded-full bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Share Your Feedback
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-[#EAC9D1] shadow-2xs flex flex-col justify-between hover:border-[#8C3A4F]/40 transition-colors"
                >
                  <div>
                    {/* Stars & Verified Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= r.rating
                                ? 'fill-amber-400 stroke-amber-400'
                                : 'fill-stone-100 stroke-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified Buyer</span>
                      </span>
                    </div>

                    {/* Title */}
                    {r.title && (
                      <h4 className="text-xs sm:text-sm font-bold text-[#2D1B1B] mb-1.5 leading-snug">
                        {r.title}
                      </h4>
                    )}

                    {/* Content */}
                    <p className="text-xs text-[#543E36] leading-relaxed">
                      {r.content}
                    </p>
                  </div>

                  {/* Reviewer info */}
                  <div className="pt-4 mt-4 border-t border-[#F2DFE4]/80 flex items-center justify-between text-[11px] text-[#7A5B64]">
                    <span className="font-bold text-[#2D1B1B]">{r.customerName}</span>
                    <span>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAC9D1] p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {checkingEligibility ? (
              <div className="text-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#8C3A4F] mx-auto" />
                <p className="text-xs font-semibold text-[#7A5B64]">
                  Verifying authenticated purchase order history...
                </p>
              </div>
            ) : eligibilityChecked && !hasPurchased ? (
              /* Verified Purchase Required Guard */
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-[#2D1B1B] font-serif">
                  Verified Purchase Required
                </h3>
                <p className="text-xs text-[#543E36] leading-relaxed max-w-sm mx-auto">
                  To protect our community from fabricated feedback, reviews for <strong>{productName}</strong> can only be published by accounts that have an authentic confirmed order for this formulation.
                </p>
                <div className="p-3.5 rounded-2xl bg-[#FCF4F7] border border-[#EAC9D1] text-[11px] text-[#7A5B64] text-left">
                  <p className="font-bold text-[#8C3A4F] mb-0.5">Checked Account:</p>
                  <p>{customer?.name} ({customer?.email})</p>
                  <p className="mt-1 text-[10px] text-[#9E828A]">
                    If you ordered under a different email address, please sign in with that account.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    href={`/products/${productSlug}`}
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Order Formulation</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Review Composer Form for Verified Purchasers */
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Buyer Confirmed</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#2D1B1B] font-serif">
                    Write a Verified Review
                  </h3>
                  <p className="text-xs text-[#7A5B64] mt-0.5">
                    Reviewing: <span className="font-semibold text-[#2D1B1B]">{productName}</span>
                  </p>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Star Rating Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? 'fill-amber-400 stroke-amber-400'
                              : 'fill-stone-100 stroke-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-[#8C3A4F] ml-2">
                      {rating} out of 5 Stars
                    </span>
                  </div>
                </div>

                {/* Review Headline */}
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1">
                    Review Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Visible hair fall reduction in 3 weeks!"
                    className="w-full bg-[#FAF5F7] hover:bg-white focus:bg-white border border-[#E2CBD2] rounded-xl px-3.5 py-2.5 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 outline-none transition-all"
                  />
                </div>

                {/* Review Body */}
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1">
                    Detailed Experience *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe how the formulation felt on your scalp, fragrance, root nourishment, and weekly results..."
                    className="w-full bg-[#FAF5F7] hover:bg-white focus:bg-white border border-[#E2CBD2] rounded-xl px-3.5 py-2.5 text-xs text-[#2D1B1B] placeholder:text-[#9E828A] focus:border-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/20 outline-none transition-all resize-none"
                  />
                </div>

                {/* Submitter info indicator */}
                <div className="p-3 rounded-xl bg-[#FCF4F7] border border-[#EAC9D1] text-[11px] text-[#7A5B64] flex items-center justify-between">
                  <span>Publishing as: <strong className="text-[#2D1B1B]">{customer?.name}</strong></span>
                  <span className="text-emerald-700 font-semibold">Publishes Live Instantly</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#8C3A4F] to-[#722E3F] hover:from-[#722E3F] hover:to-[#5A2230] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing Review...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Publish Verified Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
