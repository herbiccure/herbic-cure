'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, ExternalLink, X } from 'lucide-react';

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

export default function SocialReelsSection({ posts }: SocialReelsSectionProps) {
  const [activeVideo, setActiveVideo] = useState<SocialItem | null>(null);

  return (
    <section className="py-7 sm:py-16 bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-10">
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

          <a
            href="https://www.instagram.com/herbiccure/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 md:mt-0 inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all"
          >
            <span>Follow Instagram</span>
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>
        </div>

        {/* Mobile & Tablet: horizontal swipeable reel track; Desktop: 4-col grid */}
        <div className="flex lg:grid overflow-x-auto lg:overflow-visible snap-x snap-mandatory gap-3 sm:gap-5 lg:gap-6 pb-2.5 lg:pb-0 no-scrollbar lg:grid-cols-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setActiveVideo(post)}
              className="w-[145px] sm:w-[220px] lg:w-auto shrink-0 lg:shrink snap-start group relative aspect-9/16 rounded-2xl overflow-hidden bg-stone-800 cursor-pointer border border-stone-700/60 hover:border-amber-400/60 transition-all duration-300 hover:scale-[1.02]"
            >
              <Image
                src={post.thumbnailUrl}
                alt={post.caption || 'Herbic Cure Reel'}
                fill
                sizes="(max-width: 640px) 145px, (max-width: 1024px) 220px, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />

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
