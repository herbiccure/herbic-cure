import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

const CONTACT_KEYS = [
  'contact_phone',
  'whatsapp_number',
  'contact_email',
  'address',
  'contact_hours',
  'contact_page_title',
  'contact_page_subtitle',
];

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: CONTACT_KEYS } },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      phone: settingsMap.contact_phone || '+91 8121961219',
      whatsapp: settingsMap.whatsapp_number || '918121961219',
      email: settingsMap.contact_email || 'care@herbiccure.com',
      address:
        settingsMap.address ||
        'Herbic Cure Ayurvedic Naturals, Plot 45, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081',
      hours: settingsMap.contact_hours || 'Mon - Sat: 9:00 AM - 7:00 PM IST',
      pageTitle: settingsMap.contact_page_title || "We're Here To Support Your Hair Journey",
      pageSubtitle:
        settingsMap.contact_page_subtitle ||
        'Have questions about an order or need personalized Ayurvedic advice? Reach out below.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contact settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { phone, whatsapp, email, address, hours, pageTitle, pageSubtitle } = body;

    const updates = [
      phone !== undefined && { key: 'contact_phone', value: String(phone).trim() },
      whatsapp !== undefined && { key: 'whatsapp_number', value: String(whatsapp).trim() },
      email !== undefined && { key: 'contact_email', value: String(email).trim() },
      address !== undefined && { key: 'address', value: String(address).trim() },
      hours !== undefined && { key: 'contact_hours', value: String(hours).trim() },
      pageTitle !== undefined && { key: 'contact_page_title', value: String(pageTitle).trim() },
      pageSubtitle !== undefined && { key: 'contact_page_subtitle', value: String(pageSubtitle).trim() },
    ].filter(Boolean) as Array<{ key: string; value: string }>;

    await prisma.$transaction(
      updates.map((u) =>
        prisma.siteSetting.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update contact settings' }, { status: 500 });
  }
}
