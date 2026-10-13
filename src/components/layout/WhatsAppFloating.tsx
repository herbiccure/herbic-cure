'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatingProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export default function WhatsAppFloating({
  phoneNumber = '918121961219',
  defaultMessage = 'Namaste Herbic Cure! I would like guidance on choosing the right Ayurvedic hair routine.',
}: WhatsAppFloatingProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <aside
      aria-label="Ayurvedic WhatsApp Help"
      className="fixed bottom-6 right-6 z-50 flex items-center group"
    >
      {/* Tooltip on hover */}
      <span className="hidden sm:inline-block mr-3 px-3.5 py-1.5 rounded-full bg-stone-900/90 text-white text-xs font-semibold shadow-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none">
        Chat with Ayurvedic Doctor 🌿
      </span>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Herbic Cure on WhatsApp"
        className="relative w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white/70 animate-bounce"
        style={{ animationDuration: '3s' }}
      >
        {/* Pulse ripple */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping -z-10" />

        <svg
          className="w-8 h-8 fill-white"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.507 14.307l-.009.075c-.338.905-1.688 1.76-2.385 1.83-.622.062-1.429.088-2.308-.2-1.41-.462-2.827-1.488-4.043-2.704-1.216-1.216-2.242-2.633-2.704-4.043-.288-.879-.262-1.686-.2-2.308.07-.697.925-2.047 1.83-2.385l.075-.009c.29-.03.585.04.814.195l.056.042 1.644 2.298c.182.254.21.587.073.867l-.76 1.558c.288.66.757 1.34 1.353 1.936.596.596 1.276 1.065 1.936 1.353l1.558-.76c.28-.137.613-.109.867.073l2.298 1.644c.22.158.33.428.288.686zM12 2C6.477 2 2 6.477 2 12c0 1.892.527 3.66 1.443 5.174L2 22l4.982-1.39A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
      </a>
    </aside>
  );
}
