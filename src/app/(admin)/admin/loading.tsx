import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="min-h-[50vh] flex items-center justify-center"
    >
      <Loader2 className="w-9 h-9 text-[#8C3A4F] animate-spin" />
    </div>
  );
}
