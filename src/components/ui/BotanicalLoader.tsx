'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface BotanicalLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inline?: boolean;
}

export default function BotanicalLoader({
  size = 'md',
  className = '',
  inline = false,
}: BotanicalLoaderProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
  }[size];

  const spinner = (
    <Loader2
      className={`text-[#8C3A4F] animate-spin ${sizeClasses} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );

  if (inline) {
    return spinner;
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {spinner}
    </div>
  );
}
