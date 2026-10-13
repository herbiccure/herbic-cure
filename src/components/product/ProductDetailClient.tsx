'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Phone,
  Share2,
  ChevronRight,
  Heart,
  Droplet,
  Layers,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import OfferCountdownTimer from '@/components/ui/OfferCountdownTimer';

interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    regularPrice: number;
    salePrice?: number | null;
    shortDescription?: string | null;
    fullDescription?: string | null;
    keyBenefits?: string | null;
    ingredientsJson?: string | null;
    howToUse?: string | null;
    whyChooseUs?: string | null;
    size?: string | null;
    rating?: number;
    reviewCount?: number;
    hasTimer?: boolean | null;
    stockQuantity?: number;
    images: ProductImage[];
  };
}

export default function ProductDetailClient({ product }: ProductDetailProps) {
  const { addItem, setIsCartOpen } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: 'default', url: '/images/products/herbic-cure/herbic-cure-oil-q1.png', alt: product.name }];

  const currentPrice = product.salePrice || product.regularPrice;
  const originalPrice = product.salePrice ? product.regularPrice : null;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  let parsedBenefits: string[] = [];
  if (product.keyBenefits) {
    try {
      parsedBenefits = JSON.parse(product.keyBenefits);
    } catch {
      parsedBenefits = [product.keyBenefits];
    }
  }

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: currentPrice,
        regularPrice: originalPrice || undefined,
        image: images[0]?.url,
      },
      quantity
    );
    toast.success(`Added ${product.name} to bag!`);
    setAdded(true);
    setIsCartOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-[#A84358]">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-[#A84358]">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-semibold truncate max-w-[200px] sm:max-w-md">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-50 border border-stone-200/80 shadow-md">
            <Image
              src={images[selectedImageIndex]?.url || images[0]?.url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              priority
              className="object-cover object-center"
            />
            {discountPercent && (
              <span className="absolute top-4 left-4 bg-amber-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-[#A84358] ring-2 ring-rose-600/30 shadow-md'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img.url} alt={img.alt || product.name} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Conversion */}
        <div className="flex flex-col justify-start space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/80">
                100% Ayurvedic Formulations
              </span>
              {product.size && (
                <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                  {product.size}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-stone-800">
                {(product.rating || 4.9).toFixed(1)}
              </span>
              <span className="text-xs text-stone-400">
                ({product.reviewCount || 240} verified reviews)
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/70">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#A84358]">₹{currentPrice}</span>
              {originalPrice && (
                <span className="text-lg text-stone-400 line-through">₹{originalPrice}</span>
              )}
              {discountPercent && (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                  You Save ₹{originalPrice! - currentPrice} ({discountPercent}%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Inclusive of all taxes. Free shipping on prepaid orders.</p>
          </div>

          {/* URGENCY COUNTDOWN TIMER (Admin Controlled) */}
          {Boolean(product.hasTimer) && <OfferCountdownTimer variant="detail" />}

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-stone-600 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Key Benefits List */}
          {parsedBenefits.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Key Botanical Benefits:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                {parsedBenefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 bg-rose-50/50 p-2 rounded-xl">
                    <Check className="w-3.5 h-3.5 text-[#A84358] shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantity Selector & Add to Bag */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-100 font-bold transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-stone-900 min-w-[36px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-100 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 ${
                  added
                    ? 'bg-rose-700 text-white'
                    : 'bg-[#A84358] hover:bg-[#45363B] text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>ADDED TO BAG</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>ADD TO BAG • ₹{currentPrice * quantity}</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct WhatsApp Guidance */}
            <a
              href={`https://wa.me/918121961219?text=${encodeURIComponent(
                `Namaste Herbic Cure! I have questions regarding ${product.name}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#A84358] bg-rose-50 hover:bg-rose-100 border border-rose-200/80 flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]" />
              <span>Ask Ayurvedic Doctor on WhatsApp</span>
            </a>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-200/80 text-center">
            <div className="flex flex-col items-center p-2 rounded-xl bg-stone-50">
              <ShieldCheck className="w-5 h-5 text-[#A84358] mb-1" />
              <span className="text-[11px] font-bold text-stone-800">100% Herbal</span>
              <span className="text-[10px] text-stone-500">Zero Chemicals</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-stone-50">
              <Truck className="w-5 h-5 text-[#A84358] mb-1" />
              <span className="text-[11px] font-bold text-stone-800">Fast Shipping</span>
              <span className="text-[10px] text-stone-500">2-4 Business Days</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-stone-50">
              <RotateCcw className="w-5 h-5 text-[#A84358] mb-1" />
              <span className="text-[11px] font-bold text-stone-800">Easy Returns</span>
              <span className="text-[10px] text-stone-500">COD Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
