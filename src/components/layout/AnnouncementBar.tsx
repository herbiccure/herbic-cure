'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Truck, Leaf, MessageSquare } from 'lucide-react';

const DEFAULT_ANNOUNCEMENTS = [
  "Experience the power of South India's best natural Hair Oils",
  "Handcrafted with 21 Himalayan Herbs & Authentic Kshirapak Vidhi — 100% Pure & Toxin-Free",
  "Free Express Shipping & Cash on Delivery Available Across India on Orders Above ₹499",
];

interface AnnouncementBarProps {
  initialAnnouncements?: string[];
}

function renderAnnouncementItem(rawText: string) {
  // Strip raw and legacy emojis from text to maintain high-end editorial typography
  const text = rawText
    .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}♥]\s*/u, '')
    .trim();
  const lower = text.toLowerCase();

  let icon = <Sparkles className="w-3 h-3 text-amber-300 inline shrink-0 mr-1.5 opacity-90" />;
  if (lower.includes('shipping') || lower.includes('delivery')) {
    icon = <Truck className="w-3.5 h-3.5 text-amber-200 inline shrink-0 mr-1.5 opacity-90" />;
  } else if (lower.includes('herb') || lower.includes('oil') || lower.includes('vidhi')) {
    icon = <Leaf className="w-3 h-3 text-emerald-200 inline shrink-0 mr-1.5 opacity-90" />;
  } else if (lower.includes('whatsapp') || lower.includes('guidance')) {
    icon = <MessageSquare className="w-3 h-3 text-emerald-300 inline shrink-0 mr-1.5 opacity-90" />;
  }

  return (
    <span className="inline-flex items-center text-[11px] sm:text-xs font-semibold tracking-wider px-6 sm:px-8 whitespace-nowrap">
      {icon}
      <span>{text}</span>
    </span>
  );
}

let cachedAnnouncementData: any = null;

export default function AnnouncementBar({
  initialAnnouncements = DEFAULT_ANNOUNCEMENTS,
}: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<string[]>(
    () => cachedAnnouncementData?.announcements || initialAnnouncements
  );
  const [enabled, setEnabled] = useState(
    () => (cachedAnnouncementData ? cachedAnnouncementData.enabled : true)
  );
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>(
    () => cachedAnnouncementData?.speed || 'normal'
  );
  const [mode, setMode] = useState<'running' | 'rotating'>(
    () => cachedAnnouncementData?.mode || 'running'
  );
  const [bg, setBg] = useState(() => cachedAnnouncementData?.bg || '#A84358');
  const [textColor, setTextColor] = useState(
    () => cachedAnnouncementData?.textColor || '#ffffff'
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch live settings configured via Admin Panel (memoized)
  useEffect(() => {
    if (cachedAnnouncementData) return;
    let isMounted = true;
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        cachedAnnouncementData = data;
        if (
          data.announcements &&
          Array.isArray(data.announcements) &&
          data.announcements.length > 0
        ) {
          setAnnouncements(data.announcements);
        }
        if (typeof data.enabled === 'boolean') setEnabled(data.enabled);
        if (data.speed) setSpeed(data.speed);
        if (data.mode) setMode(data.mode);
        if (data.bg) setBg(data.bg);
        if (data.textColor) setTextColor(data.textColor);
      })
      .catch(() => {});

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

  // Animation duration mapping for continuous marquee (gentle, luxurious speed)
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
                {renderAnnouncementItem(text)}
                <Sparkles className="w-2.5 h-2.5 text-amber-300/80 shrink-0 inline select-none" />
              </div>
            ))}
          </div>

          {/* Secondary duplicate track for 100% seamless infinite scroll */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {repeatedItems.map((text, idx) => (
              <div key={`track-b-${idx}`} className="flex items-center shrink-0">
                {renderAnnouncementItem(text)}
                <Sparkles className="w-2.5 h-2.5 text-amber-300/80 shrink-0 inline select-none" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Rotating Ticker Mode */
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center min-h-[22px] text-center">
          <div
            key={currentIndex}
            className="inline-block transition-all duration-500 transform animate-fadeIn"
          >
            {renderAnnouncementItem(announcements[currentIndex] || announcements[0])}
          </div>
        </div>
      )}
    </div>
  );
}
