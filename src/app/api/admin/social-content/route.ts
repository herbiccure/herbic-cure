import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

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
    const { thumbnailUrl, videoUrl, instagramUrl, caption, productTitle, displayOrder } = body;
    if (!thumbnailUrl) {
      return NextResponse.json({ error: 'Thumbnail URL is required' }, { status: 400 });
    }

    const count = await prisma.socialPost.count();

    const created = await prisma.socialPost.create({
      data: {
        thumbnailUrl: String(thumbnailUrl).trim(),
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        instagramUrl: instagramUrl ? String(instagramUrl).trim() : null,
        caption: caption ? String(caption).trim().slice(0, 500) : null,
        productTitle: productTitle ? String(productTitle).trim().slice(0, 200) : null,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : count + 1,
        active: true,
      },
    });

    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({ success: true, post: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create social post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { id, thumbnailUrl, videoUrl, instagramUrl, caption, productTitle, displayOrder, active } = body;
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const updated = await prisma.socialPost.update({
      where: { id },
      data: {
        ...(thumbnailUrl !== undefined ? { thumbnailUrl: String(thumbnailUrl).trim() } : {}),
        ...(videoUrl !== undefined ? { videoUrl: videoUrl ? String(videoUrl).trim() : null } : {}),
        ...(instagramUrl !== undefined ? { instagramUrl: instagramUrl ? String(instagramUrl).trim() : null } : {}),
        ...(caption !== undefined ? { caption: caption ? String(caption).trim().slice(0, 500) : null } : {}),
        ...(productTitle !== undefined ? { productTitle: productTitle ? String(productTitle).trim().slice(0, 200) : null } : {}),
        ...(displayOrder !== undefined ? { displayOrder: Number(displayOrder) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    });

    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update social post' }, { status: 500 });
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

    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete social post' }, { status: 500 });
  }
}
