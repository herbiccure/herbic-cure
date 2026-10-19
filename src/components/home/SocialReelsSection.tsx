'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

interface SocialItem {
  id: string;
  thumbnailUrl: string;
  videoUrl?: string | null;
  instagramUrl?: string | null;
  caption?: string | null;
  productTitle?: string | null;
}

interface SocialReelsSectionProps {
  posts: SocialItem[];
}

const DEFAULT_REELS: SocialItem[] = [
  {
    id: 'reel-1',
    thumbnailUrl: '/images/products/herbic-cure/herbic-cure-oil-q1.png',
    instagramUrl: 'https://www.instagram.com/herbiccure/',
    caption: 'Night oiling routine with 21 herbs infusion for deep root feeding ✨',
    productTitle: '21 Herbs Hair Oil',
  },
  {
    id: 'reel-2',
    thumbnailUrl: '/images/banners/banner-1.png',
    instagramUrl: 'https://www.instagram.com/herbiccure/',
    caption: 'How to use the handcrafted Neem Wood Comb to stimulate follicles 🌿',
    productTitle: 'Neem Wood Comb',
  },
  {
    id: 'reel-3',
    thumbnailUrl: '/images/banners/banner-2.png',
    instagramUrl: 'https://www.instagram.com/herbiccure/',
    caption: 'Stop hair fall in 4 weeks! Real customer Vedic hair transformation 🙌',
    productTitle: 'Hair Therapy Kit',
  },
  {
    id: 'reel-4',
    thumbnailUrl: '/images/products/herbic-cure/herbic-cure-oil-vs-local-comparison.jpg',
    instagramUrl: 'https://www.instagram.com/herbiccure/',
    caption: 'Why 100% cold-pressed Ayurvedic Kshirapak oil beats drugstore mineral oils 💧',
    productTitle: 'Vedic Kshirapak Ritual',
  },
];

export default function SocialReelsSection({ posts }: SocialReelsSectionProps) {
  const [activeVideo, setActiveVideo] = useState<SocialItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  const displayPosts = posts && posts.length > 0 ? posts : DEFAULT_REELS;

  // Auto-slide effect (slides smoothly every 4 seconds)
  useEffect(() => {
    if (!isAutoPlaying || displayPosts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayPosts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, displayPosts.length]);

  // Smooth scroll sync
  useEffect(() => {
    if (trackRef.current) {
      const container = trackRef.current;
      const targetChild = container.children[currentIndex] as HTMLElement;
      if (targetChild) {
        const targetLeft = targetChild.offsetLeft - container.offsetLeft - 16;
        container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? displayPosts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % displayPosts.length);
  };

  return (
    <section
      className="py-7 sm:py-16 bg-stone-900 text-white overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header and Slide Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2.5">
              <InstagramIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>@herbiccure</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold font-serif text-white">
              Herbic Cure On Instagram
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">
              Watch real Indian hair wellness creators, night oiling routines, and scalp stimulation tips.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 sm:p-2.5 rounded-full bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-white border border-stone-700 transition-all cursor-pointer"
              aria-label="Previous reel"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 sm:p-2.5 rounded-full bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-white border border-stone-700 transition-all cursor-pointer"
              aria-label="Next reel"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <a
              href="https://www.instagram.com/herbiccure/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ml-1"
            >
              <span>Follow</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Mobile & Tablet & Desktop: swipeable and auto-sliding reel track */}
        <div
          ref={trackRef}
          className="flex lg:grid overflow-x-auto lg:overflow-visible snap-x snap-mandatory gap-3 sm:gap-5 lg:gap-6 pb-2.5 lg:pb-0 no-scrollbar lg:grid-cols-4"
        >
          {displayPosts.map((post, idx) => (
            <div
              key={post.id || idx}
              onClick={() => setActiveVideo(post)}
              className="w-[160px] sm:w-[230px] lg:w-auto shrink-0 lg:shrink snap-start group relative aspect-9/16 rounded-2xl overflow-hidden bg-stone-800 cursor-pointer border border-stone-700/60 hover:border-amber-400/60 transition-all duration-300 hover:scale-[1.02]"
            >
              {post.videoUrl ? (
                <video
                  src={post.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <Image
                  src={post.thumbnailUrl}
                  alt={post.caption || 'Herbic Cure Reel'}
                  fill
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 230px, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 group-hover:from-black/95 transition-colors" />

              {/* Play Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/30 backdrop-blur-md group-hover:bg-amber-400 group-hover:text-stone-950 text-white flex items-center justify-center transition-all duration-300 shadow-xl group-hover:scale-110">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Caption & Product */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 text-left">
                {post.productTitle && (
                  <span className="inline-block bg-[#A84358]/90 text-rose-200 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-xs mb-1 line-clamp-1">
                    {post.productTitle}
                  </span>
                )}
                <p className="text-[10px] sm:text-[11px] text-stone-200 line-clamp-2 leading-tight drop-shadow-sm font-medium">
                  {post.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Video Viewer */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-stone-950 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-9/16 w-full bg-black">
                {activeVideo.videoUrl ? (
                  <video
                    src={activeVideo.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-stone-900">
                    <p className="text-sm text-stone-300 mb-4">
                      {activeVideo.caption || 'Instagram Reel Preview'}
                    </p>
                    {activeVideo.instagramUrl && (
                      <a
                        href={activeVideo.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-full bg-[#A84358] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[#8C374A] transition-all"
                      >
                        <span>Watch On Instagram</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
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
