import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import StorefrontShell from '@/components/layout/StorefrontShell';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const serifFont = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Herbic Cure | 100% Ayurvedic Hair Oil & Natural Hair Care Solutions',
  description:
    'Experience the ancient science of 21 Himalayan Herbs fusion for root-to-tip hair regrowth, fall reduction, and scalp vitality.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable}`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FCF8F9] text-[#2D1B1B] antialiased selection:bg-[#F6DFE7] selection:text-[#6B2E3D]">
        <AuthProvider>
          <CartProvider>
            <StorefrontShell>{children}</StorefrontShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
