import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="min-h-[40vh] flex flex-col items-center justify-center py-16 gap-3"
    >
      <Loader2 className="w-8 h-8 text-[#8C3A4F] animate-spin" />
      <span className="text-xs font-medium text-stone-500 tracking-wider uppercase">Loading experience...</span>
    </div>
  );
}
