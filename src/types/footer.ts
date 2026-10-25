// Pure, client-safe types and default constants for Footer
export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterData {
  brand: {
    logoUrl?: string;
    brandName: string;
    tagline: string;
    description: string;
  };
  columns: FooterColumn[];
  newsletter: {
    heading: string;
    placeholder: string;
    buttonText: string;
    subtext: string;
    successMessage: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    whatsapp: string;
    youtube?: string;
    twitter?: string;
  };
  contact: {
    email: string;
    phone: string;
    hours: string;
    showContact: boolean;
  };
  bottomBar: {
    copyright: string;
    showOrganicWave: boolean;
  };
}

export const DEFAULT_FOOTER_DATA: FooterData = {
  brand: {
    logoUrl: '/images/banners/herbic-cure-logo.png',
    brandName: 'HERBIC CURE',
    tagline: 'Inspired by Himalayan Herbs',
    description:
      'Pure 21 herbs Ayurvedic fusions handcrafted with traditional Kshirapak Vidhi for root nourishment and healthy hair vitality.',
  },
  columns: [
    {
      id: 'col-collections',
      title: 'COLLECTIONS',
      links: [
        { id: 'c-1', label: 'All Collections', url: '/collections' },
        { id: 'c-2', label: 'Hair OIL', url: '/collections/hair-oils' },
        { id: 'c-3', label: 'Combo', url: '/collections/combos' },
        { id: 'c-4', label: 'Accessories', url: '/collections/accessories' },
        { id: 'c-5', label: 'Shampoo and Conditioner', url: '/collections/shampoo-and-conditioner' },
      ],
    },
    {
      id: 'col-about',
      title: 'ABOUT',
      links: [
        { id: 'a-1', label: 'About Us', url: '/about' },
        { id: 'a-2', label: 'Review', url: '/reviews' },
        { id: 'a-3', label: '21 Himalayan Herbs', url: '/ingredients' },
        { id: 'a-4', label: 'Customer Results', url: '/results' },
        { id: 'a-5', label: 'Hair Care Tips', url: '/hair-care-tips' },
      ],
    },
    {
      id: 'col-links',
      title: 'USEFUL LINKS',
      links: [
        { id: 'u-1', label: 'Cancellation/Refund policies', url: '/refund-policy' },
        { id: 'u-2', label: 'Privacy Policy', url: '/privacy-policy' },
        { id: 'u-3', label: 'Shipping Policy', url: '/shipping-policy' },
        { id: 'u-4', label: 'Terms & Conditions', url: '/terms' },
        { id: 'u-5', label: 'Contact Us', url: '/contact' },
      ],
    },
  ],
  newsletter: {
    heading: 'Join our newsletter for exclusive deals!',
    placeholder: 'Enter your email',
    buttonText: 'Subscribe',
    subtext: 'Zero spam. Only authentic Ayurvedic hair wellness updates & VIP discounts.',
    successMessage: 'Thank you! You will receive our secret Ayurvedic offers.',
  },
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    whatsapp: 'https://wa.me/918121961219',
    youtube: '',
    twitter: '',
  },
  contact: {
    email: 'support@herbiccure.com',
    phone: '+91 8121961219',
    hours: 'Mon - Sat: 10:00 AM - 7:00 PM IST',
    showContact: true,
  },
  bottomBar: {
    copyright: '@Herbic Cure. All Rights Reserved.',
    showOrganicWave: true,
  },
};
