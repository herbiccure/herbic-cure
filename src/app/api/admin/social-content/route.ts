import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const posts = await prisma.socialPost.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { thumbnailUrl, videoUrl, instagramUrl, caption, productTitle } = body;
    if (!thumbnailUrl) {
      return NextResponse.json({ error: 'Thumbnail URL is required' }, { status: 400 });
    }

    const created = await prisma.socialPost.create({
      data: {
        thumbnailUrl: String(thumbnailUrl).trim(),
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        instagramUrl: instagramUrl ? String(instagramUrl).trim() : null,
        caption: caption ? String(caption).trim().slice(0, 500) : null,
        productTitle: productTitle ? String(productTitle).trim().slice(0, 200) : null,
      },
    });

    return NextResponse.json({ success: true, post: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create social post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await request.json().catch(() => ({}));
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }
    await prisma.socialPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete social post' }, { status: 500 });
  }
}
