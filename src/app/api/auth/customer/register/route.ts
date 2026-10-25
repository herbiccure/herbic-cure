import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signSessionToken } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitError = enforceRateLimit(request, 'customer_register', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => ({}));
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newCustomer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        phone: phone ? phone.trim() : null,
      },
    });

    const customerPayload = {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
    };

    const sessionToken = signSessionToken(customerPayload, 30 * 24 * 60 * 60);

    const response = NextResponse.json({
      success: true,
      customer: customerPayload,
    });

    response.cookies.set('customer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    logger.info('auth.customer.register.success', { userId: customerPayload.id });
    return response;
  } catch (error: any) {
    logger.error('auth.customer.register.failed', { error: error?.message || 'Failed to create customer account' });
    return NextResponse.json({ error: 'Failed to create customer account' }, { status: 500 });
  }
}
