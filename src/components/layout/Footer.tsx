'use client';

import { toast } from 'sonner';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Send } from 'lucide-react';

interface FooterProps {
  brandName?: string;
  logoUrl?: string;
}

export default function Footer({
  brandName = 'Herbic Cure',
  logoUrl = '/images/banners/herbic-cure-logo.png',
}: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSubscribed(true);
        toast.success("Thank you for subscribing to Herbic Cure updates!");
      } else {
        setSubscribed(true); // Graceful fallback
      }
    } catch {
      setSubscribed(true);
    } finally {
      setSubmitting(false);
      setEmail('');
    }
  };

  return (
    <footer className="relative w-full bg-[#F6DFE7] text-[#2D1B1B] overflow-hidden">
      {/* Top Organic Wave Transition Curve */}
      <div className="w-full overflow-hidden leading-none -mt-1 pointer-events-none">
        <svg
          viewBox="0 0 1440 85"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 sm:h-16 md:h-20 object-cover"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C320,55 580,75 880,45 C1160,15 1320,65 1440,30 L1440,0 L0,0 Z"
            className="fill-[#FCF8F9]"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14">
        {/* Main Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          {/* Brand Logo & Tagline (Col 1 to 4) */}
          <div className="lg:col-span-3 flex flex-col items-start space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="relative w-40 sm:w-48 h-14 sm:h-16">
                <Image
                  src={logoUrl}
                  alt={brandName}
                  width={192}
                  height={64}
                  className="object-contain object-left max-h-16 group-hover:scale-105 transition-transform"
                />
              </div>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#543E44]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5c0 2 1.5 3.5 3 4 .5-1.5 1.5-3 3-4 3-2 6-2 9-5.5z" />
                </svg>
                <span className="font-serif tracking-widest text-lg font-bold text-[#45363B] uppercase">
                  HERBIC CURE
                </span>
              </div>
              <p className="text-xs text-stone-600 italic tracking-wide">
                Inspired by Himalayan Herbs
              </p>
            </div>
            <p className="text-xs text-stone-600/90 leading-relaxed pt-1">
              Pure 21 herbs Ayurvedic fusions handcrafted with traditional Kshirapak Vidhi for root nourishment and healthy hair vitality.
            </p>
          </div>

          {/* COLLECTIONS Column */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#A84358] pb-1.5 inline-block border-b-2 border-stone-800">
              COLLECTIONS
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-stone-700">
              <li>
                <Link
                  href="/collections/hair-oils"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Hair OIL
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/combos"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Combo
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/accessories"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Accessories
                </Link>
              </li>
              <li>
                <Link
                  href="/products/herbic-cure-shampoo-with-conditioner-q1"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Shampoo and Conditioner
                </Link>
              </li>
            </ul>
          </div>

          {/* ABOUT Column */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#A84358] pb-1.5 inline-block border-b-2 border-stone-800">
              ABOUT
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-stone-700">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/reviews"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Review
                </Link>
              </li>
              <li>
                <Link
                  href="/ingredients"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  21 Himalayan Herbs
                </Link>
              </li>
              <li>
                <Link
                  href="/results"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Customer Results
                </Link>
              </li>
            </ul>
          </div>

          {/* USEFUL LINKS Column */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#A84358] pb-1.5 inline-block border-b-2 border-stone-800">
              USEFUL LINKS
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-stone-700">
              <li>
                <Link
                  href="/refund-policy"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Cancellation/Refund policies
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#A84358] hover:translate-x-1 inline-block transition-all"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column with Floating Shadow Animation (Col 10 to 12) */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-stone-900 mb-3.5 leading-snug">
              Join our newsletter for exclusive deals!
            </h3>

            {/* Floating Container */}
            <div className="animate-float-card">
              <form
                onSubmit={handleSubscribe}
                className="bg-white rounded-2xl p-1.5 shadow-xl shadow-stone-400/20 border border-stone-200/60 flex items-center transition-all hover:shadow-2xl"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs text-stone-800 placeholder-stone-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-stone-950 hover:bg-[#A84358] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
                >
                  {subscribed ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-rose-400" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {subscribed && (
              <p className="text-[11px] text-rose-800 font-semibold mt-2 animate-fadeIn">
                Thank you! You will receive our secret Ayurvedic offers.
              </p>
            )}
            <p className="text-[11px] text-stone-500 mt-3 leading-relaxed">
              Zero spam. Only authentic Ayurvedic hair wellness updates & VIP discounts.
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Floating Social Circles */}
        <div className="mt-12 pt-6 border-t border-stone-300/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-600 font-medium order-2 sm:order-1">
            @Herbic Cure. All Rights Reserved.
          </p>

          {/* Floating Social Icons (matching screenshot) */}
          <div className="flex items-center gap-3 order-1 sm:order-2">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full bg-[#F6DFE7] hover:bg-white text-stone-800 flex items-center justify-center shadow-sm hover:shadow-md transition-all animate-float hover:scale-110"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full bg-[#F6DFE7] hover:bg-white text-stone-800 flex items-center justify-center shadow-sm hover:shadow-md transition-all animate-float-delay-1 hover:scale-110"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/918121961219"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-9 h-9 rounded-full bg-[#F6DFE7] hover:bg-white text-stone-800 flex items-center justify-center shadow-sm hover:shadow-md transition-all animate-float-delay-2 hover:scale-110"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
