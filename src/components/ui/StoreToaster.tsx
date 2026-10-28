'use client';

import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { Check, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

export default function StoreToaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      richColors={false}
      closeButton
      offset={24}
      mobileOffset={{ bottom: 20, left: 16, right: 16 }}
      gap={8}
      duration={3500}
      icons={{
        success: (
          <span className="w-5 h-5 rounded-full bg-[#F6DFE7] border border-[#EAC9D1] flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-[#8C3A4F] stroke-[2.5]" />
          </span>
        ),
        error: (
          <span className="w-5 h-5 rounded-full bg-[#FFE4E6] border border-[#FDA4AF] flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-[#BE123C] stroke-[2.5]" />
          </span>
        ),
        info: (
          <span className="w-5 h-5 rounded-full bg-[#FAF0F4] border border-[#E2CBD2] flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5 text-[#8C3A4F] stroke-[2.5]" />
          </span>
        ),
        warning: (
          <span className="w-5 h-5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] stroke-[2.5]" />
          </span>
        ),
        loading: (
          <span className="w-5 h-5 rounded-full bg-[#F6DFE7] flex items-center justify-center shrink-0">
            <Loader2 className="w-3.5 h-3.5 text-[#8C3A4F] animate-spin" />
          </span>
        ),
      }}
      toastOptions={{
        className: 'herbic-toast-card',
        classNames: {
          toast: '!bg-[#FFF4F7] !text-[#2D1B1B] !border-[#EAC9D1] !rounded-2xl !shadow-xl herbic-toast-card',
          title: '!text-[#2D1B1B] !font-semibold !text-xs sm:!text-sm',
          description: '!text-[#6B2E3D] !text-xs',
          success: '!bg-[#FFF4F7] !border-[#EAC9D1] !text-[#2D1B1B]',
          error: '!bg-[#FFF0F3] !border-[#FDA4AF] !text-[#2D1B1B]',
          info: '!bg-[#FAF0F4] !border-[#E2CBD2] !text-[#2D1B1B]',
          warning: '!bg-[#FFFDF7] !border-[#FDE68A] !text-[#78350F]',
          closeButton: '!bg-[#FFF0F4] !border-[#EAC9D1] !text-[#8C3A4F] hover:!bg-[#F6DFE7]',
        },
        style: {
          backgroundColor: '#FFF4F7',
          borderColor: '#EAC9D1',
          color: '#2D1B1B',
        },
      }}
    />
  );
}

