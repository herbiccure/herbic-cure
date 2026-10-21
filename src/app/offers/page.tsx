import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/product/ProductCard';
import { Tag, Sparkles, ArrowRight } from 'lucide-react';

export const revalidate = 60;


export default async function OffersPage() {
  let coupons: any[] = [];
  let comboProducts: any[] = [];
  try {
    const [fetchedCoupons, fetchedCombos] = await Promise.all([
      prisma.coupon.findMany({
        where: { active: true, isPublic: true },
      }),
      prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { isOnSale: true },
            { slug: { contains: 'combo' } },
            { slug: { contains: 'kit' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          regularPrice: true,
          salePrice: true,
          stockQuantity: true,
          isBestSeller: true,
          isFeatured: true,
          isOnSale: true,
          hasTimer: true,
          rating: true,
          reviewCount: true,
          images: {
            select: { url: true, alt: true },
            orderBy: { displayOrder: 'asc' },
            take: 1,
          },
        },
      }),
    ]);
    coupons = fetchedCoupons;
    comboProducts = fetchedCombos;
  } catch (err) {
    console.warn('Offers query deferred during build/ISR:', (err as any)?.message || String(err));
  }

  return (
    <div className="bg-[#FCF8F9] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Exclusive Ayurvedic Savings</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 font-serif">
            Current Offers & Value Combos
          </h1>
          <p className="text-sm text-stone-600 mt-2">
            Maximize your hair regrowth results and save more with bundled kits and seasonal coupon vouchers.
          </p>
        </div>

        {/* Coupons Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-3xl border-2 border-dashed border-rose-300 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-base font-extrabold text-[#A84358] bg-rose-50 px-3 py-1 rounded-lg">
                    {c.code}
                  </span>
                  <Tag className="w-4 h-4 text-rose-600" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mt-2">
                  {c.discountType === 'PERCENTAGE'
                    ? `Flat ${c.discountValue}% OFF`
                    : `Flat ₹${c.discountValue} OFF`}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {c.minOrderValue && c.minOrderValue > 0
                    ? `Applicable on orders above ₹${c.minOrderValue}`
                    : 'Valid on all orders'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                Use code at checkout to claim discount.
              </div>
            </div>
          ))}
        </div>

        {/* Value Combos Grid */}
        <div className="pt-6">
          <h2 className="text-2xl font-bold font-serif text-stone-900 mb-6">
            Discounted Bundles & Kits
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {comboProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                regularPrice={p.regularPrice}
                salePrice={p.salePrice}
                image={p.images[0]?.url || '/images/banners/banner-1.png'}
                rating={p.rating}
                reviewCount={p.reviewCount}
                isBestSeller={p.isBestSeller}
                isOnSale={p.isOnSale}
                hasTimer={p.hasTimer}
                stockQuantity={p.stockQuantity}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
