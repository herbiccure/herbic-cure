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

let footerCache: FooterData | null = null;

export async function getFooterData(): Promise<FooterData> {
  if (footerCache) {
    return footerCache;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const record = await prisma.siteSetting.findUnique({
      where: { key: 'footer_settings' },
    });

    if (record?.value) {
      const parsed = JSON.parse(record.value);
      const merged: FooterData = {
        brand: {
          logoUrl: parsed.brand?.logoUrl || DEFAULT_FOOTER_DATA.brand.logoUrl,
          brandName: parsed.brand?.brandName || DEFAULT_FOOTER_DATA.brand.brandName,
          tagline: parsed.brand?.tagline || DEFAULT_FOOTER_DATA.brand.tagline,
          description: parsed.brand?.description || DEFAULT_FOOTER_DATA.brand.description,
        },
        columns:
          Array.isArray(parsed.columns) && parsed.columns.length > 0
            ? parsed.columns
            : DEFAULT_FOOTER_DATA.columns,
        newsletter: {
          heading: parsed.newsletter?.heading || DEFAULT_FOOTER_DATA.newsletter.heading,
          placeholder: parsed.newsletter?.placeholder || DEFAULT_FOOTER_DATA.newsletter.placeholder,
          buttonText: parsed.newsletter?.buttonText || DEFAULT_FOOTER_DATA.newsletter.buttonText,
          subtext: parsed.newsletter?.subtext || DEFAULT_FOOTER_DATA.newsletter.subtext,
          successMessage:
            parsed.newsletter?.successMessage || DEFAULT_FOOTER_DATA.newsletter.successMessage,
        },
        socialLinks: {
          facebook: parsed.socialLinks?.facebook ?? DEFAULT_FOOTER_DATA.socialLinks.facebook,
          instagram: parsed.socialLinks?.instagram ?? DEFAULT_FOOTER_DATA.socialLinks.instagram,
          whatsapp: parsed.socialLinks?.whatsapp ?? DEFAULT_FOOTER_DATA.socialLinks.whatsapp,
          youtube: parsed.socialLinks?.youtube ?? '',
          twitter: parsed.socialLinks?.twitter ?? '',
        },
        contact: {
          email: parsed.contact?.email || DEFAULT_FOOTER_DATA.contact.email,
          phone: parsed.contact?.phone || DEFAULT_FOOTER_DATA.contact.phone,
          hours: parsed.contact?.hours || DEFAULT_FOOTER_DATA.contact.hours,
          showContact:
            parsed.contact?.showContact !== undefined
              ? parsed.contact.showContact
              : DEFAULT_FOOTER_DATA.contact.showContact,
        },
        bottomBar: {
          copyright: parsed.bottomBar?.copyright || DEFAULT_FOOTER_DATA.bottomBar.copyright,
          showOrganicWave:
            parsed.bottomBar?.showOrganicWave !== undefined
              ? parsed.bottomBar.showOrganicWave
              : DEFAULT_FOOTER_DATA.bottomBar.showOrganicWave,
        },
      };

      footerCache = merged;
      return merged;
    }
  } catch (error) {
    console.warn('Footer data database fallback used:', (error as any)?.message || String(error));
  }

  return DEFAULT_FOOTER_DATA;
}

export async function saveFooterData(data: Partial<FooterData>): Promise<FooterData> {
  const current = await getFooterData();

  const updated: FooterData = {
    brand: {
      logoUrl: data.brand?.logoUrl ?? current.brand.logoUrl,
      brandName: data.brand?.brandName ?? current.brand.brandName,
      tagline: data.brand?.tagline ?? current.brand.tagline,
      description: data.brand?.description ?? current.brand.description,
    },
    columns: data.columns ?? current.columns,
    newsletter: {
      heading: data.newsletter?.heading ?? current.newsletter.heading,
      placeholder: data.newsletter?.placeholder ?? current.newsletter.placeholder,
      buttonText: data.newsletter?.buttonText ?? current.newsletter.buttonText,
      subtext: data.newsletter?.subtext ?? current.newsletter.subtext,
      successMessage: data.newsletter?.successMessage ?? current.newsletter.successMessage,
    },
    socialLinks: {
      facebook: data.socialLinks?.facebook ?? current.socialLinks.facebook,
      instagram: data.socialLinks?.instagram ?? current.socialLinks.instagram,
      whatsapp: data.socialLinks?.whatsapp ?? current.socialLinks.whatsapp,
      youtube: data.socialLinks?.youtube ?? current.socialLinks.youtube,
      twitter: data.socialLinks?.twitter ?? current.socialLinks.twitter,
    },
    contact: {
      email: data.contact?.email ?? current.contact.email,
      phone: data.contact?.phone ?? current.contact.phone,
      hours: data.contact?.hours ?? current.contact.hours,
      showContact: data.contact?.showContact ?? current.contact.showContact,
    },
    bottomBar: {
      copyright: data.bottomBar?.copyright ?? current.bottomBar.copyright,
      showOrganicWave: data.bottomBar?.showOrganicWave ?? current.bottomBar.showOrganicWave,
    },
  };

  const { prisma } = await import('@/lib/prisma');
  footerCache = updated;

  await prisma.siteSetting.upsert({
    where: { key: 'footer_settings' },
    update: { value: JSON.stringify(updated) },
    create: { key: 'footer_settings', value: JSON.stringify(updated) },
  });

  if (updated.brand?.logoUrl) {
    await prisma.siteSetting.upsert({
      where: { key: 'footer_logo' },
      update: { value: updated.brand.logoUrl },
      create: { key: 'footer_logo', value: updated.brand.logoUrl },
    });
  }

  return updated;
}

export function clearFooterCache(): void {
  footerCache = null;
}
