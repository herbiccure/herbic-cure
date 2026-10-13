'use client';

import React, { useState } from 'react';
import { Star, MessageSquarePlus, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductOption {
  id: string;
  name: string;
}

interface WriteReviewModalProps {
  products: ProductOption[];
}

export default function WriteReviewModal({ products }: WriteReviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !customerName.trim() || !content.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setSubmitted(true);
      toast.success('Thank you! Your verified review has been submitted.');
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setCustomerName('');
        setCustomerEmail('');
        setTitle('');
        setContent('');
        setRating(5);
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-[#A84358] hover:bg-[#45363B] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span>Write a Verified Review</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-rose-600 mx-auto" />
                <h3 className="text-lg font-bold text-stone-900 font-serif">Review Submitted!</h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  Thank you for sharing your authentic experience. Your review helps thousands of people choose natural Ayurvedic hair care.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-stone-900 font-serif">
                    Share Your Ayurvedic Experience
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Your real feedback empowers the community.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Select Formulation *</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#A84358]"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Overall Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
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
                    <span className="text-xs font-semibold text-stone-600 ml-2">
                      {rating} out of 5 Stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma, Bengaluru"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#A84358]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="priya@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#A84358]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Review Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Hair fall stopped within 3 weeks!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#A84358]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Detailed Review *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how the oil or neem comb affected your hair density, roots, and scalp..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#A84358]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
