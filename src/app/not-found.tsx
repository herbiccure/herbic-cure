import Link from 'next/link';
import { Compass, Home, ShoppingBag, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found (404)',
  description:
    'The Ayurvedic page or formulation you are looking for has been moved, renamed, or is unavailable.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FCF8F9]">
      <div className="max-w-lg w-full text-center space-y-8 bg-white/80 backdrop-blur border border-[#E8D7DC] p-8 md:p-12 rounded-3xl shadow-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F6DFE7] text-[#6B2E3D]">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#8C3A4F] font-semibold">
            Status 404 • Resource Not Found
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2D1B1B]">
            Lost in the Herbal Forest?
          </h1>
          <p className="text-sm text-[#5C454A] leading-relaxed">
            The page, article, or formulation you requested has either moved or no longer exists. Explore our bestselling authentic Ayurvedic remedies below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#6B2E3D] text-white text-sm font-medium hover:bg-[#52222E] transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Store Homepage</span>
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F6DFE7] text-[#6B2E3D] text-sm font-medium hover:bg-[#ECCCD6] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>All Formulations</span>
          </Link>
          <Link
            href="/collections/hair-oils"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#D5C0C7] text-[#2D1B1B] text-sm font-medium hover:bg-white transition-colors"
          >
            <span>21 Herbs Hair Oils</span>
          </Link>
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#D5C0C7] text-[#2D1B1B] text-sm font-medium hover:bg-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Ayurvedic Help</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
