import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Shipment',
    alternates: {
    canonical: '/track-order',
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
