'use client';

import React, { useState, useEffect } from 'react';

const DEFAULT_ANNOUNCEMENTS = [
  '♥ Experience the power of South India’s best natural Hair Oils',
  '🌿 Handcrafted with 21 Himalayan Herbs & Authentic Kshirapak Vidhi – 100% Pure & Toxin-Free',
  '🚚 Free Express Shipping & Cash on Delivery Available Across India on Orders Above ₹499',
];

interface AnnouncementBarProps {
  initialAnnouncements?: string[];
}

export default function AnnouncementBar({ initialAnnouncements = DEFAULT_ANNOUNCEMENTS }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<string[]>(initialAnnouncements);
  const [enabled, setEnabled] = useState(true);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [mode, setMode] = useState<'running' | 'rotating'>('running');
  const [bg, setBg] = useState('#A84358');
  const [textColor, setTextColor] = useState('#ffffff');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch live settings configured via Admin Panel
  useEffect(() => {
    let isMounted = true;
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.announcements && Array.isArray(data.announcements) && data.announcements.length > 0) {
          setAnnouncements(data.announcements);
        }
        if (typeof data.enabled === 'boolean') setEnabled(data.enabled);
        if (data.speed) setSpeed(data.speed);
        if (data.mode) setMode(data.mode);
        if (data.bg) setBg(data.bg);
        if (data.textColor) setTextColor(data.textColor);
      })
      .catch(() => {
        // Gracefully use default seeded values
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // For rotating mode (if toggled in admin)
  useEffect(() => {
    if (mode !== 'rotating' || announcements.length <= 1) return;
    const intervalTime = speed === 'fast' ? 3000 : speed === 'slow' ? 6000 : 4500;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [mode, announcements, speed]);

  if (!enabled || announcements.length === 0) {
    return null;
  }

  // Animation duration mapping for continuous marquee (slower, gentle, luxurious speed)
  const durationSec = speed === 'fast' ? '45s' : speed === 'slow' ? '95s' : '65s';

  // In running mode: repeat lines to ensure wide screen coverage before seamless wrap
  const repeatMultiplier = 3;
  const repeatedItems = Array(repeatMultiplier).fill(announcements).flat();

  return (
    <div
      style={{ backgroundColor: bg, color: textColor }}
      className="relative w-full overflow-hidden border-b border-black/15 py-2 transition-colors select-none z-30"
      aria-label="Store Announcement Ticker"
    >
      {mode === 'running' ? (
        /* Continuous Running Marquee Ticker */
        <div
          className="flex w-max animate-marquee hover:[animation-play-state:paused] cursor-default"
          style={{ animationDuration: durationSec }}
        >
          {/* Primary loop track */}
          <div className="flex items-center shrink-0">
            {repeatedItems.map((text, idx) => (
              <div key={`track-a-${idx}`} className="flex items-center shrink-0">
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider px-6 sm:px-8 inline-block whitespace-nowrap">
                  {text}
                </span>
                <span className="text-amber-400/90 text-[10px] sm:text-xs shrink-0 select-none opacity-80">
                  ✦
                </span>
              </div>
            ))}
          </div>

          {/* Secondary duplicate track for 100% seamless infinite scroll */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {repeatedItems.map((text, idx) => (
              <div key={`track-b-${idx}`} className="flex items-center shrink-0">
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider px-6 sm:px-8 inline-block whitespace-nowrap">
                  {text}
                </span>
                <span className="text-amber-400/90 text-[10px] sm:text-xs shrink-0 select-none opacity-80">
                  ✦
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Rotating Ticker Mode */
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center min-h-[22px] text-center">
          <span
            key={currentIndex}
            className="inline-block transition-all duration-500 transform animate-fadeIn font-semibold tracking-wide text-[11px] sm:text-xs"
          >
            {announcements[currentIndex] || announcements[0]}
          </span>
        </div>
      )}
    </div>
  );
}
