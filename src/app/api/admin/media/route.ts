import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ media });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { name, url, alt, sizeBytes = 150000, mimeType = 'image/jpeg' } = body;

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    const cleanUrl = String(url).trim();
    const isValidUrlScheme =
      cleanUrl.startsWith('http://') ||
      cleanUrl.startsWith('https://') ||
      cleanUrl.startsWith('/');

    if (!isValidUrlScheme || cleanUrl.toLowerCase().includes('javascript:')) {
      return NextResponse.json(
        { error: 'Invalid media URL scheme. Only HTTP, HTTPS, or relative asset paths are allowed.' },
        { status: 400 }
      );
    }

    const created = await prisma.media.create({
      data: {
        name: String(name).trim().slice(0, 200),
        url: cleanUrl,
        alt: alt ? String(alt).trim().slice(0, 255) : name,
        sizeBytes: Number(sizeBytes) || 150000,
        mimeType: String(mimeType).trim().slice(0, 100),
      },
    });

    return NextResponse.json({ success: true, media: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create media item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await request.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    await prisma.media.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
