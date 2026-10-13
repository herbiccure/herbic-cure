'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAdminTheme } from './AdminThemeProvider';
import { cn } from '@/lib/utils';

export interface AdminThemeToggleProps {
  variant?: 'segmented' | 'compact';
  showLabel?: boolean;
  className?: string;
}

export function AdminThemeToggle({
  variant,
  showLabel = true,
  className = '',
}: AdminThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useAdminTheme();
  const isDark = theme === 'dark';

  // Determine mode: if variant is explicitly provided, use it; otherwise showLabel determines segmented vs compact
  const isCompact = variant === 'compact' || (!variant && !showLabel);

  if (isCompact) {
    return (
      <div
        data-theme-toggle="compact"
        className={cn(
          'admin-theme-toggle-root inline-flex items-center p-0.5 rounded-full border transition-all duration-200 shadow-2xs select-none',
          isDark
            ? 'bg-slate-800/90 border-slate-700'
            : 'bg-stone-200/70 border-stone-300/80',
          className
        )}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-label="Switch to light mode"
          title="Light Mode"
          className={cn(
            'p-1.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center',
            !isDark
              ? 'bg-white text-amber-600 shadow-xs ring-1 ring-black/5 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Sun className="w-3.5 h-3.5 fill-amber-400/20" />
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-label="Switch to dark mode"
          title="Dark Mode"
          className={cn(
            'p-1.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center',
            isDark
              ? 'bg-[#A84358] text-white shadow-xs ring-1 ring-white/10 scale-105'
              : 'text-stone-400 hover:text-stone-700'
          )}
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Segmented Pill with explicit Light and Dark tabs
  return (
    <div
      data-theme-toggle="segmented"
      className={cn(
        'admin-theme-toggle-root inline-flex items-center p-1 rounded-full border transition-all duration-200 shadow-2xs select-none',
        isDark
          ? 'bg-slate-800/90 border-slate-700/80'
          : 'bg-stone-200/70 border-stone-300/80',
        className
      )}
    >
      {/* Light Option */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-label="Enable light theme"
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer',
          !isDark
            ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200/70'
            : 'text-slate-400 hover:text-slate-200 font-medium'
        )}
      >
        <Sun
          className={cn(
            'w-3.5 h-3.5 transition-colors',
            !isDark ? 'text-amber-500 fill-amber-400/30' : 'text-slate-400'
          )}
        />
        <span>Light</span>
      </button>

      {/* Dark Option */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-label="Enable dark theme"
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer',
          isDark
            ? 'bg-[#A84358] text-white font-bold shadow-xs border border-rose-500/30'
            : 'text-stone-500 hover:text-stone-800 font-medium'
        )}
      >
        <Moon
          className={cn(
            'w-3.5 h-3.5 transition-colors',
            isDark ? 'text-rose-100 fill-rose-300/30' : 'text-stone-400'
          )}
        />
        <span>Dark</span>
      </button>
    </div>
  );
}
