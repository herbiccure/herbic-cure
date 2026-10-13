import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Herbal Cart',
    alternates: {
    canonical: '/cart',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
