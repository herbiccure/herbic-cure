'use client';
import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { normalizeImageUrl } from '@/lib/utils';

export interface LazyImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  wrapperClassName?: string;
  fallbackSrc?: string;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  fallbackSrc = '/images/banners/banner-1.png',
  priority = false,
  fill,
  width,
  height,
  sizes,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const normalizedSrc = typeof src === 'string' ? normalizeImageUrl(src) : src;
  const [imgSrc, setImgSrc] = useState(normalizedSrc);

  useEffect(() => {
    if (typeof src === 'string') {
      setImgSrc(normalizeImageUrl(src));
    } else {
      setImgSrc(src);
    }
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-[#FCF4F7] ${wrapperClassName}`}
    >
      {/* Rose Pearl & Petal Shimmer Skeleton (active until image finishes loading) */}
      {!isLoaded && (
        <div className="absolute inset-0 z-0 animate-shimmer bg-[#FCF4F7] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center justify-center opacity-60">
            <svg
              className="w-7 h-7 text-[#8C3A4F]/30 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918"
              />
            </svg>
          </div>
        </div>
      )}

      <Image
        src={imgSrc || fallbackSrc}
        alt={alt || 'Herbic Cure'}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        unoptimized={typeof imgSrc === 'string' && imgSrc.startsWith('http')}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          }
          setIsLoaded(true);
        }}
        className={`transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
