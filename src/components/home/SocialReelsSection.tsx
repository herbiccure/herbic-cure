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

export interface SocialItem {
  id: string;
  thumbnailUrl: string;
  videoUrl?: string | null;
  instagramUrl?: string | null;
  caption?: string | null;
  productTitle?: string | null;
  duration?: string | null;
}

function ReelThumbnail({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  const activeSrc = errorSrc === src || !src ? '/images/banners/client-1.png' : src;

  return (
    <Image
      src={activeSrc}
      alt={alt}
      fill
      sizes="(max-width: 640px) 240px, (max-width: 1024px) 280px, 25vw"
      onError={() => {
        setErrorSrc(src);
      }}
      className="object-cover group-hover:scale-105 transition-transform duration-700"
    />
  );
}


interface SocialReelsSectionProps {
  posts: SocialItem[];
  title?: string;
  subtitle?: string;
}

const DEFAULT_REELS: SocialItem[] = [
  {
    id: 'reel-1',
    thumbnailUrl: '/images/products/herbic-cure/herbic-cure-oil-q1.png',
    instagramUrl: 'https://www.instagram.com/herbiccure/',
    caption: 'Night oiling routine with Herbic Cure 21 Herbs Fusion Hair Oil ✨',
    productTitle: '21 Herbs Fusion Hair Oil',
    duration: '0:50',
  },
  {
    id: 'reel-2',
    thumbnailUrl: '/images/banners/banner-1.png',
    instagramUrl: 'https://www.instagram.com/herbiccure/',
    caption: 'Neem wood comb + 21 herbs oil: The easiest 5-minute hair routine 🌿',
    productTitle: 'Complete Hair Therapy Kit',
    duration: '1:10',
  },
  {
    id: 'reel-3',
    thumbnailUrl: '/images/banners/banner-2.png',
    instagramUrl: 'https://www.instagram.com/herbiccure/',
    caption: '12-week shedding turnaround: Noticeable improvement in root strength 🙌',
    productTitle: '21 Herbs Hair Oil Pack',
    duration: '0:45',
  },
  {
    id: 'reel-4',
    thumbnailUrl: '/images/products/herbic-cure/herbic-cure-oil-vs-local-comparison.jpg',
    instagramUrl: 'https://www.instagram.com/herbiccure/',
    caption: 'Why 100% cold-pressed Ayurvedic Kshirapak oil beats drugstore mineral oils 💧',
    productTitle: 'Vedic Kshirapak Ritual',
    duration: '0:35',
  },
];

import ReelPlayer from '@/components/ui/ReelPlayer';

export default function SocialReelsSection({
  posts,
  title = 'Herbic Cure On Instagram',
  subtitle = 'Watch real Indian hair wellness creators, night oiling routines, and scalp stimulation tips.',
}: SocialReelsSectionProps) {
  const [activeVideo, setActiveVideo] = useState<SocialItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const displayPosts = posts && posts.length > 0 ? posts : DEFAULT_REELS;

  // Auto-slide effect (slides smoothly every 4 seconds)
  useEffect(() => {
    if (!isAutoPlaying || displayPosts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayPosts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, displayPosts.length]);

  // Smooth scroll sync with active slide
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
      onMouseLeave={() => {
        setIsAutoPlaying(true);
        setHoveredIndex(null);
      }}
      onTouchStart={() => setIsAutoPlaying(false)}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header and Slide Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2.5">
              <InstagramIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>@herbiccure</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold font-serif text-white">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 sm:p-2.5 rounded-full bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-white border border-stone-700 transition-all cursor-pointer shadow-sm"
              aria-label="Previous reel"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 sm:p-2.5 rounded-full bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-white border border-stone-700 transition-all cursor-pointer shadow-sm"
              aria-label="Next reel"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <a
              href="https://www.instagram.com/herbiccure/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ml-1 shadow-sm"
            >
              <span>Follow</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Swipeable and auto-sliding reel track */}
        <div
          ref={trackRef}
          className="flex lg:grid overflow-x-auto lg:overflow-visible snap-x snap-mandatory gap-4 sm:gap-6 pb-2.5 lg:pb-0 no-scrollbar lg:grid-cols-4"
        >
          {displayPosts.map((post, idx) => {
            const isActive = idx === currentIndex;
            const isHovered = hoveredIndex === idx;
            const shouldPlay = isActive || isHovered;

            return (
              <div
                key={post.id || idx}
                onClick={() => setActiveVideo(post)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`w-[240px] sm:w-[280px] lg:w-auto shrink-0 lg:shrink snap-start group relative aspect-9/14 sm:aspect-9/15 rounded-3xl overflow-hidden bg-stone-950 cursor-pointer border transition-all duration-300 ${
                  isActive
                    ? 'border-amber-400/80 shadow-2xl ring-2 ring-amber-400/30'
                    : 'border-stone-800 hover:border-amber-400/50 opacity-90 hover:opacity-100'
                }`}
              >
                {(() => {
                  const cardVideoUrl = post.videoUrl || (post.instagramUrl && (post.instagramUrl.includes('/reel/') || post.instagramUrl.includes('/p/')) ? post.instagramUrl : null);
                  return (
                    <>
                      <ReelThumbnail
                        src={post.thumbnailUrl}
                        alt={post.caption || 'Herbic Cure Reel'}
                      />
                      {cardVideoUrl && shouldPlay && (
                        <div className="absolute inset-0 w-full h-full z-1">
                          <ReelPlayer
                            url={cardVideoUrl}
                            thumbnailUrl={post.thumbnailUrl}
                            playing={shouldPlay}
                            muted={true}
                            loop={true}
                            controls={false}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Subtle gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 group-hover:from-black/95 transition-colors pointer-events-none" />

                {/* Center Play Button indicator (fades subtly when playing to keep focus on video) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                      shouldPlay
                        ? 'bg-white/20 backdrop-blur-xs text-white opacity-40 group-hover:opacity-90 group-hover:scale-105'
                        : 'bg-white/90 text-[#8C3A4F] group-hover:bg-[#8C3A4F] group-hover:text-white group-hover:scale-110'
                    }`}
                  >
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Bottom Caption & Product */}
                <div className="absolute bottom-3 left-3 right-3 text-left space-y-1 z-10 pointer-events-none">
                  {post.productTitle && (
                    <span className="inline-block bg-[#A84358]/95 text-rose-100 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider mb-0.5 line-clamp-1 border border-rose-400/30">
                      {post.productTitle}
                    </span>
                  )}
                  <p className="text-[11px] sm:text-xs text-stone-100 line-clamp-2 leading-snug drop-shadow-md font-semibold">
                    {post.caption}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slide Indicator Dots (pill for active, dots for inactive) */}
        <div className="flex items-center justify-center gap-2 mt-5 sm:mt-7">
          {displayPosts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-7 bg-amber-400' : 'w-2 bg-stone-700 hover:bg-stone-500'
              }`}
              aria-label={`Go to reel ${idx + 1}`}
            />
          ))}
        </div>

        {/* Modal Video Viewer */}
        {activeVideo && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
            onClick={() => setActiveVideo(null)}
          >
            <div
              className="relative w-full max-w-md bg-stone-950 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-9/16 w-full bg-black flex items-center justify-center overflow-hidden">
                {(() => {
                  const modalVideoUrl = activeVideo.videoUrl || (activeVideo.instagramUrl && (activeVideo.instagramUrl.includes('/reel/') || activeVideo.instagramUrl.includes('/p/')) ? activeVideo.instagramUrl : null);

                  if (modalVideoUrl) {
                    return (
                      <ReelPlayer
                        url={modalVideoUrl}
                        thumbnailUrl={activeVideo.thumbnailUrl}
                        playing={true}
                        muted={false}
                        controls={true}
                        className="w-full h-full object-contain"
                      />
                    );
                  }

                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-6 bg-stone-950 overflow-hidden">
                      {activeVideo.thumbnailUrl && (
                        <Image
                          src={activeVideo.thumbnailUrl}
                          alt={activeVideo.caption || 'Reel Preview'}
                          fill
                          className="object-cover opacity-30 blur-xs scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-950/60" />

                      <div className="relative z-10 max-w-xs space-y-4 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-xl flex items-center justify-center">
                          <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center text-white">
                            <InstagramIcon className="w-7 h-7" />
                          </div>
                        </div>

                        {activeVideo.productTitle && (
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                            {activeVideo.productTitle}
                          </span>
                        )}

                        <p className="text-sm font-medium text-stone-200 line-clamp-3 leading-relaxed">
                          {activeVideo.caption || 'Watch this exclusive routine on our official Instagram page.'}
                        </p>

                        {activeVideo.instagramUrl && (
                          <a
                            href={activeVideo.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#A84358] to-[#8C374A] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
                          >
                            <span>Watch On Instagram</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal footer with product info and external link */}
              {(activeVideo.caption || activeVideo.productTitle || activeVideo.instagramUrl) && (
                <div className="p-4 bg-stone-900/90 border-t border-stone-800 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {activeVideo.productTitle && (
                      <span className="text-[10px] uppercase font-bold text-amber-400 block truncate">
                        {activeVideo.productTitle}
                      </span>
                    )}
                    {activeVideo.caption && (
                      <p className="text-xs text-stone-200 line-clamp-1">
                        {activeVideo.caption}
                      </p>
                    )}
                  </div>
                  {activeVideo.instagramUrl && (
                    <a
                      href={activeVideo.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Open on Instagram"
                    >
                      <InstagramIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Instagram</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
