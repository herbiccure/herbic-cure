import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signSessionToken } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitError = enforceRateLimit(request, 'customer_login', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    const identifier = (email || '').trim();
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email or Mobile Number and password are required' },
        { status: 400 }
      );
    }

    const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
    const isPhone = /^[6-9]\d{9}$/.test(cleanPhone);

    const customer = await prisma.customer.findFirst({
      where: isPhone
        ? {
            OR: [{ phone: cleanPhone }, { email: identifier.toLowerCase() }],
          }
        : { email: identifier.toLowerCase() },
    });

    if (!customer || !customer.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email/phone or password' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email/phone or password' },
        { status: 401 }
      );
    }

    const customerPayload = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };

    const sessionToken = signSessionToken(customerPayload, 30 * 24 * 60 * 60);

    const response = NextResponse.json({
      success: true,
      customer: customerPayload,
    });

    // Set secure httpOnly cookie
    response.cookies.set('customer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json({ error: 'Server login error' }, { status: 500 });
  }
}
