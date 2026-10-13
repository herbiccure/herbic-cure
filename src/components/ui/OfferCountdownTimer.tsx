'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Flame, Sparkles } from 'lucide-react';

interface OfferCountdownTimerProps {
  variant?: 'badge' | 'detail' | 'compact';
  className?: string;
  seedMinutes?: number;
}

export default function OfferCountdownTimer({
  variant = 'badge',
  className = '',
  seedMinutes = 48,
}: OfferCountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: seedMinutes, seconds: 35 });

  useEffect(() => {
    setMounted(true);

    // Create a predictable yet persistent countdown anchor based on 1-hour rolling cycles
    const now = Date.now();
    const cycleDurationMs = 60 * 60 * 1000; // 1 hour cycle
    const msIntoCycle = now % cycleDurationMs;
    const msRemaining = cycleDurationMs - msIntoCycle;

    const totalSeconds = Math.floor(msRemaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setTimeLeft({ hours, minutes, seconds });

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to 59 minutes when hit zero
          return { hours: 0, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    // SSR Placeholder to prevent layout shift & hydration mismatch
    if (variant === 'detail') {
      return (
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-full border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span>Limited Time Deal</span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>Ends soon</span>
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  // Variant 1: Detailed Banner for Product Detail Page
  if (variant === 'detail') {
    return (
      <div
        className={`bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs animate-pulse">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                Special Launch Deal
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <p className="text-[11px] text-amber-800 font-medium">
              Limited introductory price reserved for this session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-stone-900 bg-white/90 px-3 py-1.5 rounded-xl border border-amber-200 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Ends in:</span>
          <span className="bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-md">
            {pad(timeLeft.hours)}h
          </span>
          <span className="text-stone-400">:</span>
          <span className="bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-md">
            {pad(timeLeft.minutes)}m
          </span>
          <span className="text-stone-400">:</span>
          <span className="bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-md text-amber-300">
            {pad(timeLeft.seconds)}s
          </span>
        </div>
      </div>
    );
  }

  // Variant 2: Compact Pill for Product Cards & Grids
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/80 ${className}`}
      >
        <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
        <span>
          Offer: {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
        </span>
      </div>
    );
  }

  // Variant 3: Default Badge
  return (
    <div
      className={`inline-flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-extrabold text-amber-900 bg-amber-100/90 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-300 shadow-xs max-w-full truncate ${className}`}
    >
      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-700 shrink-0 animate-pulse" />
      <span className="truncate">
        Ends in <strong className="font-mono text-stone-900">{pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s</strong>
      </span>
    </div>
  );
}
