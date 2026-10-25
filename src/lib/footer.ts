import 'server-only';
import { logger } from '@/lib/logger';
import { FooterData, DEFAULT_FOOTER_DATA } from '@/types/footer';

export * from '@/types/footer';

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
  } catch (error: any) {
    logger.debug('footer.fallback_used', { error: error?.message });
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
