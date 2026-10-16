'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import WhatsAppFloating from '@/components/layout/WhatsAppFloating';

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  const [logoUrl, setLogoUrl] = useState('/images/banners/herbic-cure-logo.png');
  const [brandName, setBrandName] = useState('Herbic Cure');

  useEffect(() => {
    let isMounted = true;
    fetch('/api/navigation')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.logoUrl) setLogoUrl(data.logoUrl);
        if (data?.brandName) setBrandName(data.brandName);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF8F9] text-[#1a221c]">
      <AnnouncementBar />
      <Header logoUrl={logoUrl} brandName={brandName} />
      <main className="flex-1">{children}</main>
      <Footer logoUrl={logoUrl} brandName={brandName} />
      <CartDrawer />
      <WhatsAppFloating />
    </div>
  );
}
