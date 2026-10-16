import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-[#FCF4F7] border border-[#EAC9D1]/30 ${className}`}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-rose-950/10 p-0 flex flex-col h-full shadow-xs">
      {/* Image Area Skeleton */}
      <div className="relative w-full aspect-square bg-[#FCF4F7] animate-shimmer overflow-hidden flex items-center justify-center">
        <svg
          className="w-10 h-10 text-[#D8B2BA]/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Content Area Skeleton */}
      <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-16 h-3 rounded-full" />
            <Skeleton className="w-8 h-3 rounded-full ml-auto" />
          </div>

          {/* Title Lines */}
          <Skeleton className="w-11/12 h-4 rounded" />
          <Skeleton className="w-3/4 h-3.5 rounded" />
        </div>

        {/* Price & CTA */}
        <div className="pt-2 border-t border-[#F6DFE7]/60 space-y-2.5">
          <div className="flex items-baseline gap-2">
            <Skeleton className="w-16 h-5 rounded" />
            <Skeleton className="w-12 h-3.5 rounded" />
          </div>
          <Skeleton className="w-full h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="w-[140px] sm:w-[220px] lg:w-auto shrink-0 bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-rose-950/10">
      <div className="relative aspect-4/3 sm:aspect-square bg-[#FCF4F7] animate-shimmer flex items-center justify-center">
        <svg
          className="w-8 h-8 text-[#D8B2BA]/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div className="p-2 sm:p-3 space-y-1.5">
        <Skeleton className="w-3/4 h-4 rounded" />
        <Skeleton className="w-1/2 h-3 rounded" />
      </div>
    </div>
  );
}
