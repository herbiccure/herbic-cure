'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LazyImage from '@/components/ui/LazyImage';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import OfferCountdownTimer from '@/components/ui/OfferCountdownTimer';

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  regularPrice: number;
  salePrice?: number | null;
  image?: string;
  rating?: number;
  reviewCount?: number;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  hasTimer?: boolean;
  stockQuantity?: number;
}

export default function ProductCard({
  id,
  name,
  slug,
  regularPrice,
  salePrice,
  image = '/images/banners/banner-1.png',
  rating = 4.9,
  reviewCount = 210,
  isBestSeller = false,
  isOnSale = true,
  hasTimer = false,
  stockQuantity = 50,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = React.useState(false);

  const currentPrice = salePrice || regularPrice;
  const originalPrice = salePrice ? regularPrice : null;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      name,
      slug,
      price: currentPrice,
      regularPrice: originalPrice || undefined,
      image,
    });
    toast.success(`Added "${name}" to bag!`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-rose-950/10 hover:border-rose-700/30 hover:shadow-xl hover:shadow-rose-950/5 transition-all duration-300 flex flex-col h-full">
      {/* Product Image Area */}
      <Link href={`/products/${slug}`} className="relative w-full aspect-square overflow-hidden bg-stone-50 block">
        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 flex flex-col gap-1 items-start">
          {isBestSeller && (
            <span className="bg-[#A84358] text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs tracking-wider uppercase">
              Best Seller
            </span>
          )}
          {discountPercent && discountPercent > 0 && (
            <span className="bg-amber-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* In-Stock Indicator */}
        {stockQuantity <= 15 && stockQuantity > 0 && (
          <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10">
            <span className="bg-red-50 text-red-600 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded border border-red-200">
              Only {stockQuantity} left!
            </span>
          </div>
        )}

        <LazyImage
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          wrapperClassName="w-full h-full"
        />
      </Link>

      {/* Info Area */}
      <div className="p-2.5 sm:p-4 lg:p-5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 stroke-amber-400 shrink-0" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-gray-800">{rating.toFixed(1)}</span>
            <span className="text-[10px] sm:text-[11px] text-gray-400">({reviewCount})</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded ml-auto">
              Verified
            </span>
          </div>

          {/* Title */}
          <Link
            href={`/products/${slug}`}
            className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#A84358] line-clamp-2 transition-colors leading-snug min-h-[2rem] sm:min-h-[2.5rem]"
          >
            {name}
          </Link>
        </div>

        {/* Pricing & Add to Cart */}
        <div>
          <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 mb-2 sm:mb-2.5">
            <span className="text-sm sm:text-lg font-extrabold text-[#A84358]">
              ₹{currentPrice}
            </span>
            {originalPrice && (
              <span className="text-[11px] sm:text-sm text-gray-400 line-through">
                ₹{originalPrice}
              </span>
            )}
            {discountPercent && (
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-700">
                Save ₹{originalPrice! - currentPrice}
              </span>
            )}
          </div>

          {/* Urgency Countdown Timer (Admin Controlled) */}
          {hasTimer && (
            <div className="mb-2 sm:mb-2.5">
              <OfferCountdownTimer variant="badge" />
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className={`w-full py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 shadow-sm ${
              added
                ? 'bg-rose-700 text-white'
                : 'bg-[#A84358] hover:bg-[#45363B] text-white active:scale-98'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                <span className="truncate">ADDED</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">ADD TO BAG</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
