'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
} from 'lucide-react';

export interface ProductVideoItem {
  id: string;
  title: string;
  subtitle: string;
  productName: string;
  productUrl: string;
  price: string;
  videoUrl?: string;
  thumbnailUrl: string;
  duration?: string;
}

const DEFAULT_PRODUCT_VIDEOS: ProductVideoItem[] = [
  {
    id: 'vid-1',
    title: '72-Hour Vedic Kshirapak Vidhi',
    subtitle: 'Witness the sacred slow-cooking of 21 Himalayan roots in pure milk.',
    productName: '21 Herbs Fusion Hair Oil',
    productUrl: '/products/herbic-cure-21-herbs-fusion-hair-oil-q1',
    price: '₹599',
    thumbnailUrl: '/images/products/herbic-cure/herbic-cure-oil-q1.png',
    duration: '0:45',
  },
  {
    id: 'vid-2',
    title: 'Root Comb Application Ritual',
    subtitle: 'Deep follicle feeding with gentle circular scalp stimulation.',
    productName: 'Herbic Cure Hair Oil + Comb',
    productUrl: '/products/herbic-cure-21-herbs-fusion-hair-oil-q1',
    price: '₹799',
    thumbnailUrl: '/images/banners/banner-1.png',
    duration: '0:35',
  },
  {
    id: 'vid-3',
    title: 'Handcrafted Neem Wood Detangling',
    subtitle: 'Anti-static, anti-frizz comb infused with pure antimicrobial neem oils.',
    productName: 'Vedic Neem Wood Comb',
    productUrl: '/products/herbic-cure-21-herbs-fusion-hair-oil-q1',
    price: '₹249',
    thumbnailUrl: '/images/banners/banner-2.png',
    duration: '0:50',
  },
  {
    id: 'vid-4',
    title: 'Real 30-Day Root Strength Results',
    subtitle: 'Visible reduction in shedding and new follicular density along the hairline.',
    productName: 'Ultimate Hair Therapy Kit',
    productUrl: '/collections/combos',
    price: '₹1,299',
    thumbnailUrl: '/images/products/herbic-cure/herbic-cure-oil-vs-local-comparison.jpg',
    duration: '1:10',
  },
];

export default function ProductVideosSection({
  videos = DEFAULT_PRODUCT_VIDEOS,
}: {
  videos?: ProductVideoItem[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeModalVideo, setActiveModalVideo] = useState<ProductVideoItem | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const displayVideos = videos.length > 0 ? videos : DEFAULT_PRODUCT_VIDEOS;

  // Auto-play sliding interval (slides every 4 seconds)
  useEffect(() => {
    if (!isAutoPlaying || displayVideos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayVideos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, displayVideos.length]);

  // Scroll into view on mobile when slide index changes
  useEffect(() => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      const child = container.children[currentIndex] as HTMLElement;
      if (child) {
        const scrollLeft = child.offsetLeft - container.offsetLeft - 16;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? displayVideos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % displayVideos.length);
  };

  return (
    <section
      className="py-8 sm:py-20 bg-[#FAF4F6] border-t border-stone-200/70 overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-2 sm:mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Ayurveda In Action</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 font-serif leading-tight">
              Watch Our Product Formulations &amp; Rituals
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 sm:mt-2 max-w-xl leading-relaxed">
              Experience the ancient science of Kshirapak Vidhi, scalp massage rituals, and pure botanical nourishment.
            </p>
          </div>

          {/* Slider Controls (Prev / Next Buttons & Auto-play status) */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2.5 sm:p-3 rounded-full bg-white hover:bg-[#8C3A4F] hover:text-white text-[#2D1B1B] border border-[#EAC9D1] shadow-xs transition-all cursor-pointer"
              aria-label="Previous Video Slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2.5 sm:p-3 rounded-full bg-white hover:bg-[#8C3A4F] hover:text-white text-[#2D1B1B] border border-[#EAC9D1] shadow-xs transition-all cursor-pointer"
              aria-label="Next Video Slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Video Slider Track */}
        <div
          ref={sliderRef}
          className="flex lg:grid lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar snap-x snap-mandatory"
        >
          {displayVideos.map((video, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={video.id}
                className="w-[260px] sm:w-[300px] lg:w-auto shrink-0 snap-start group"
              >
                <div
                  onClick={() => setActiveModalVideo(video)}
                  className="relative aspect-9/14 rounded-3xl overflow-hidden bg-stone-900 shadow-md group-hover:shadow-xl transition-all duration-300 border border-[#EAC9D1]/80 cursor-pointer"
                >
                  {/* Thumbnail / Video Preview */}
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    sizes="(max-width: 640px) 260px, (max-width: 1024px) 300px, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />

                  {/* Gradient Overlay for Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                  {/* Top Badge (Duration / Active pulse) */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>{video.duration || '0:45'}</span>
                    </span>

                    {isActive && (
                      <span className="text-[10px] font-bold text-amber-300 bg-[#8C3A4F]/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-rose-400/30">
                        Playing
                      </span>
                    )}
                  </div>

                  {/* Center Play Button with Ripple Animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 text-[#8C3A4F] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-[#8C3A4F] group-hover:text-white transition-all duration-300">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Information */}
                  <div className="absolute bottom-3 left-3 right-3 text-left space-y-1">
                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                      {video.productName}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-sm font-serif">
                      {video.title}
                    </h3>
                    <p className="text-[11px] text-stone-300 line-clamp-2 leading-tight opacity-90">
                      {video.subtitle}
                    </p>

                    {/* Price & Shop CTA */}
                    <div className="pt-2 flex items-center justify-between border-t border-white/20 mt-2">
                      <span className="text-xs font-extrabold text-amber-400">{video.price}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white group-hover:text-amber-300 uppercase tracking-wider">
                        <span>View Ritual</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dots Indicators for Mobile Slide Tracking */}
        <div className="flex items-center justify-center gap-2 mt-4 lg:hidden">
          {displayVideos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-6 bg-[#8C3A4F]' : 'w-2 bg-[#EAC9D1]'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Video Player Modal */}
        {activeModalVideo && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-stone-950 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveModalVideo(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                aria-label="Close video player"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-9/14 w-full bg-black">
                {activeModalVideo.videoUrl ? (
                  <video
                    src={activeModalVideo.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full flex flex-col justify-end p-6">
                    <Image
                      src={activeModalVideo.thumbnailUrl}
                      alt={activeModalVideo.title}
                      fill
                      className="object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    <div className="relative z-10 space-y-3">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                        {activeModalVideo.productName}
                      </span>
                      <h3 className="text-xl font-bold text-white font-serif">
                        {activeModalVideo.title}
                      </h3>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        {activeModalVideo.subtitle}
                      </p>

                      <div className="pt-2 flex items-center gap-3">
                        <Link
                          href={activeModalVideo.productUrl}
                          onClick={() => setActiveModalVideo(null)}
                          className="flex-1 py-3 px-5 rounded-xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Shop {activeModalVideo.productName} • {activeModalVideo.price}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
