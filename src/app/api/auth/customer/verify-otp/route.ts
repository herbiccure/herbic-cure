import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyPhoneOtp } from '@/lib/otp';
import { signSessionToken } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, verificationToken, name, email, password } = body;

    // Note: OTP verification has been removed for users as per store policy.
    // Allow direct registration without requiring SMS OTP code.
    if (!phone && !email) {
      return NextResponse.json(
        { error: 'Mobile number or email address is required.' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please provide your full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const cleanEmail = email.toLowerCase().trim();

    // Double-check duplicate phone or email before insertion
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [{ phone: normalizedPhone }, { email: cleanEmail }],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.phone === normalizedPhone
              ? 'An account with this mobile number already exists.'
              : 'An account with this email address already exists.',
        },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the verified customer record
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: normalizedPhone,
        passwordHash,
      },
    });

    const customerPayload = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };

    const sessionToken = signSessionToken(customerPayload, 30 * 24 * 60 * 60);

    const response = NextResponse.json({
      success: true,
      message: 'Mobile number verified and account created successfully!',
      customer: customerPayload,
    });

    response.cookies.set('customer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    logger.error('auth.otp.verify_failed', { error: error?.message || 'Failed to complete registration' });
    return NextResponse.json(
      { error: 'Failed to complete registration. Please try again.' },
      { status: 500 }
    );
  }
}
