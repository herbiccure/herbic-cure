'use client';

import React, { useState } from 'react';
import { Leaf, Flower2, Sprout, Droplets } from 'lucide-react';

interface HerbImageBadgeProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md';
}

function getBotanicalIcon(name: string, sizeClass: string) {
  const norm = (name || '').toLowerCase();
  if (norm.includes('hibiscus') || norm.includes('rose') || norm.includes('flower')) {
    return <Flower2 className={`${sizeClass} text-[#8C3A4F]`} />;
  }
  if (norm.includes('fenugreek') || norm.includes('methi') || norm.includes('seed') || norm.includes('sprout')) {
    return <Sprout className={`${sizeClass} text-[#8C3A4F]`} />;
  }
  if (norm.includes('oil') || norm.includes('aloe') || norm.includes('amla')) {
    return <Droplets className={`${sizeClass} text-[#8C3A4F]`} />;
  }
  return <Leaf className={`${sizeClass} text-[#8C3A4F]`} />;
}

export default function HerbImageBadge({ src, alt, size = 'md' }: HerbImageBadgeProps) {
  // mode transitions: 'image' -> 'favicon' -> 'icon'
  const [mode, setMode] = useState<'image' | 'favicon' | 'icon'>(src ? 'image' : 'favicon');

  const iconSizeClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  if (mode === 'icon') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF5F7] to-[#F6DFE7] text-[#8C3A4F]">
        {getBotanicalIcon(alt, iconSizeClass)}
      </div>
    );
  }

  if (mode === 'favicon') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF5F7] to-[#F6DFE7] p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.ico"
          alt={alt}
          className={`${iconSizeClass} object-contain`}
          onError={() => setMode('icon')}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src!}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setMode('favicon')}
    />
  );
}
