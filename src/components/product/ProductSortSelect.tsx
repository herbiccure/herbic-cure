'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

interface ProductSortSelectProps {
  currentSort: string;
  categoryFilter?: string;
  searchQuery?: string;
}

export default function ProductSortSelect({
  currentSort = 'featured',
  categoryFilter,
  searchQuery,
}: ProductSortSelectProps) {
  const router = useRouter();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams();
    if (categoryFilter) params.set('category', categoryFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (newSort && newSort !== 'featured') {
      params.set('sort', newSort);
    }
    const query = params.toString();
    router.push(`/products${query ? `?${query}` : ''}`, { scroll: false });
  };

  return (
    <div className="relative inline-flex items-center">
      <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 pointer-events-none" />
      <select
        value={currentSort}
        onChange={handleSortChange}
        aria-label="Sort products"
        className="appearance-none bg-white text-stone-800 text-xs font-semibold pl-7 pr-7 py-1.5 rounded-lg border border-stone-200/90 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#A84358] focus:border-[#A84358] cursor-pointer"
      >
        <option value="featured">Featured</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="rating">Top Rated</option>
        <option value="newest">Newest First</option>
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 pointer-events-none" />
    </div>
  );
}
