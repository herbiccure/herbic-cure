import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import StorefrontShell from '@/components/layout/StorefrontShell';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';

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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.herbiccure.com';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Herbic Cure | 21 Herbs Fusion Hair Oil & Ayurvedic Hair Wellness',
    template: '%s | Herbic Cure',
  },
  description:
    'Herbic Cure: Nature in Every Drop. 100% natural, mineral-oil-free 21 Herbs Fusion Hair Oil prepared using 72-hour Vedic Kshirapak Vidhi, handcrafted neem wood combs, and sulfate-free cleansers.',
  applicationName: 'Herbic Cure',
  keywords: [
    'Ayurvedic hair oil',
    '21 herbs hair oil',
    'Kshirapak Vidhi hair oil',
    'hair fall control oil India',
    'neem wood comb',
    'ayurvedic hair care routine',
    'chemical free hair oil',
  ],
  authors: [{ name: 'Herbic Cure Ayurvedic Naturals' }],
  creator: 'Herbic Cure',
  publisher: 'Herbic Cure',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Herbic Cure',
    title: 'Herbic Cure | 21 Herbs Fusion Hair Oil & Ayurvedic Hair Wellness',
    description:
      'Experience authentic Vedic botanical hair restoration. 100% mineral-oil-free, 21 Himalayan Herbs, handcrafted neem combs, and Pan-India delivery.',
    images: [
      {
        url: '/images/banners/herbic-hero-banner-1.jpg',
        width: 1200,
        height: 630,
        alt: 'Herbic Cure 21 Herbs Fusion Hair Oil & Ayurvedic Hair Wellness',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Herbic Cure | 21 Herbs Fusion Hair Oil',
    description:
      'Experience authentic Vedic botanical hair restoration with 21 pure Himalayan herbs slow-cooked in milk.',
    images: ['/images/banners/herbic-hero-banner-1.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable}`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FCF8F9] text-[#2D1B1B] antialiased selection:bg-[#F6DFE7] selection:text-[#6B2E3D]">
        <NextTopLoader color="#8C3A4F" initialPosition={0.12} crawlSpeed={200} height={3} crawl={true} showSpinner={false} easing="ease" speed={200} shadow="0 0 14px #8C3A4F, 0 0 7px #e8b159" zIndex={99999} />
        <AuthProvider>
          <CartProvider>
            <StorefrontShell>{children}</StorefrontShell>
            <Toaster richColors position="top-right" closeButton />
            <SpeedInsights />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
