import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';
import { enforceRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 10 contact messages per minute per IP
    const rateLimitError = enforceRateLimit(request, 'contact_submission', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => null);
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid contact form details' },
        { status: 400 }
      );
    }

    const { name, email, phone, message } = parsed.data;

    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        subject: body?.subject?.slice(0, 150) || 'Customer Inquiry',
        message,
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    logger.error('contact.submit_failed', { error });
    return NextResponse.json({ error: 'Failed to submit contact message' }, { status: 500 });
  }
}
