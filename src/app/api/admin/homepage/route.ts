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
