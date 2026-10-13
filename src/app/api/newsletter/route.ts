import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { newsletterSchema } from '@/lib/validations';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 10 subscriptions per minute per IP
    const rateLimitError = enforceRateLimit(request, 'newsletter_subscribe', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => null);
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Valid email address is required' },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const name = body?.name ? String(body.name).slice(0, 100) : null;

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!existing) {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
          name,
          source: 'HOMEPAGE_FOOTER',
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
