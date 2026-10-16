import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [sections, setting] = await Promise.all([
      prisma.homepageSection.findMany({
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.siteSetting.findUnique({
        where: { key: 'navbar_offers_enabled' },
      }),
    ]);

    const navbarOffersEnabled = setting ? setting.value === 'true' : false;

    return NextResponse.json({
      sections,
      navbarOffersEnabled,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch homepage sections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json();
    const { sectionType, title, subtitle, contentJson, active = true } = body;

    if (!sectionType) {
      return NextResponse.json({ error: 'Section type is required' }, { status: 400 });
    }

    // Determine default order
    const maxOrderSection = await prisma.homepageSection.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const nextOrder = (maxOrderSection?.displayOrder ?? -1) + 1;

    // Default contentJson based on type if not supplied
    let finalContentJson = contentJson;
    if (!finalContentJson) {
      if (sectionType === 'HERO' || sectionType === 'HERO_SLIDER') {
        finalContentJson = JSON.stringify({
          slides: [
            {
              desktopImage: '/images/banners/herbic-hero-banner-1.jpg',
              mobileImage: '/images/banners/herbic-hero-banner-1.jpg',
              badge: 'Authentic Ayurvedic Kshirapak Vidhi',
              heading: 'Herbic Cure - 21 Herbs Fusion Hair Oil',
              subheading: 'Ancient Ayurveda for Modern Strength. Nature In Every Drop: 100% Herbal infusion of 21 roots and botanical extracts to stop hair fall.',
              ctaText: 'SHOP INTRODUCTORY OFFER (33% OFF)',
              ctaUrl: '/products/herbic-cure-21-herbs-fusion-hair-oil-q1',
              secondaryCtaText: 'VIEW 21 HERBS',
              secondaryCtaUrl: '/ingredients',
            },
            {
              desktopImage: '/images/banners/herbic-hero-banner-2.jpg',
              mobileImage: '/images/banners/herbic-hero-banner-2.jpg',
              badge: 'Authentic Ayurvedic Kshirapak Vidhi',
              heading: 'Complete Hair Therapy Ritual Kits',
              subheading: 'Stop hair fall, cleanse gently, and detangle with 21 Herbs Hair Oil, Shampoo with Conditioner & Handcrafted Neem Wood Comb.',
              ctaText: 'EXPLORE KITS & COMBOS',
              ctaUrl: '/collections/combos',
              secondaryCtaText: 'ORDER ON WHATSAPP',
              secondaryCtaUrl: 'https://wa.me/918121961219',
            },
          ],
        });
      } else {
        finalContentJson = JSON.stringify({});
      }
    }

    const created = await prisma.homepageSection.create({
      data: {
        sectionType,
        title: title || sectionType.replace(/_/g, ' '),
        subtitle: subtitle || null,
        contentJson: finalContentJson,
        displayOrder: nextOrder,
        active: Boolean(active),
      },
    });

    return NextResponse.json({ success: true, section: created });
  } catch (error: any) {
    console.error('Failed to create section:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create section' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json();
    const { id, active, displayOrder, title, subtitle, contentJson, navbarOffersEnabled, syncOfferBanner } = body;

    // Handle Taskbar Offers toggle
    if (navbarOffersEnabled !== undefined) {
      const boolVal = Boolean(navbarOffersEnabled);
      await prisma.siteSetting.upsert({
        where: { key: 'navbar_offers_enabled' },
        update: { value: String(boolVal) },
        create: { key: 'navbar_offers_enabled', value: String(boolVal) },
      });

      // Optionally sync the OFFER_BANNER section in HomepageSection as well
      if (syncOfferBanner) {
        const offerBanner = await prisma.homepageSection.findFirst({
          where: { sectionType: 'OFFER_BANNER' },
        });
        if (offerBanner) {
          await prisma.homepageSection.update({
            where: { id: offerBanner.id },
            data: { active: boolVal },
          });
        }
      }

      if (!id) {
        return NextResponse.json({ success: true, navbarOffersEnabled: boolVal });
      }
    }

    // Handle Batch Reorder of Sections (array of IDs in their exact display order)
    if (Array.isArray(body.reorder)) {
      const updates = body.reorder.map((sectionId: string, idx: number) =>
        prisma.homepageSection.update({
          where: { id: sectionId },
          data: { displayOrder: idx },
        })
      );
      await prisma.$transaction(updates);
      return NextResponse.json({ success: true, reorderedCount: body.reorder.length });
    }

    // Handle Homepage Section updates
    if (id) {
      const updated = await prisma.homepageSection.update({
        where: { id },
        data: {
          active: active !== undefined ? Boolean(active) : undefined,
          displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
          title: title !== undefined ? title : undefined,
          subtitle: subtitle !== undefined ? subtitle : undefined,
          contentJson: contentJson !== undefined ? contentJson : undefined,
        },
      });
      return NextResponse.json({ success: true, section: updated });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    await prisma.homepageSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Failed to delete section:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete section' }, { status: 500 });
  }
}
