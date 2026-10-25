import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    logger.error('admin.blog.fetch_failed', { error });
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const body = await request.json().catch(() => ({}));
    const { id, title, slug, featuredImage, excerpt, content, category, author, published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const postSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (id) {
      const updated = await prisma.blogPost.update({
        where: { id },
        data: {
          title,
          slug: postSlug,
          featuredImage: featuredImage || null,
          excerpt: excerpt || null,
          content,
          category: category || 'Hair Care',
          author: author || 'Herbic Cure Ayurvedic Team',
          published: published !== undefined ? Boolean(published) : true,
        },
      });
      return NextResponse.json({ success: true, post: updated });
    }

    const created = await prisma.blogPost.create({
      data: {
        title,
        slug: postSlug,
        featuredImage: featuredImage || '/images/banners/banner-1.png',
        excerpt: excerpt || (content.substring(0, 150) + '...'),
        content,
        category: category || 'Hair Care',
        author: author || 'Herbic Cure Ayurvedic Team',
        published: published !== undefined ? Boolean(published) : true,
      },
    });

    return NextResponse.json({ success: true, post: created });
  } catch (error: any) {
    logger.error('admin.blog.save_failed', { error });
    return NextResponse.json({ error: error.message || 'Failed to save blog post' }, { status: 500 });
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

    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('admin.blog.delete_failed', { error });
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}

export const PUT = POST;
