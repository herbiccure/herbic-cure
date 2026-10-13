import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us & Ayurvedic Consultation Support',
  description: 'Reach Herbic Cure in Hyderabad, India via WhatsApp, phone, or email. Get expert Ayurvedic hair regimen guidance.',
  alternates: {
    canonical: '/contact',
  },
  
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
