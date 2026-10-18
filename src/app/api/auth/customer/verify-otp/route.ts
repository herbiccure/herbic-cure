import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyPhoneOtp } from '@/lib/otp';
import { signSessionToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, verificationToken, name, email, password } = body;

    // Validate required fields
    if (!phone || !otp || !verificationToken) {
      return NextResponse.json(
        { error: 'Mobile number, OTP, and verification token are required.' },
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

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP using otplib and token signature
    const verification = verifyPhoneOtp(normalizedPhone, otp, verificationToken);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration. Please try again.' },
      { status: 500 }
    );
  }
}
