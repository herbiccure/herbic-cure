import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePhoneOtp, checkOtpRateLimit } from '@/lib/otp';
import { sendSmsOtp } from '@/lib/sms';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const ipRateLimit = enforceRateLimit(request, 'send_otp_ip', 6, 60 * 1000);
    if (ipRateLimit) return ipRateLimit;

    const body = await request.json();
    const { phone, email } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Mobile number is required for OTP verification.' },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

    // Validate standard Indian mobile number (10 digits starting with 6, 7, 8, or 9)
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // Check if phone number is already registered to another customer
    const existingCustomerByPhone = await prisma.customer.findFirst({
      where: { phone: normalizedPhone },
    });

    if (existingCustomerByPhone) {
      return NextResponse.json(
        {
          error:
            'An account with this mobile number is already registered. Please sign in to your account.',
          alreadyRegistered: true,
        },
        { status: 409 }
      );
    }

    // If email is provided at this step, check if email is already taken
    if (email && typeof email === 'string' && email.trim().length > 0) {
      const cleanEmail = email.toLowerCase().trim();
      const existingCustomerByEmail = await prisma.customer.findUnique({
        where: { email: cleanEmail },
      });

      if (existingCustomerByEmail) {
        return NextResponse.json(
          {
            error:
              'An account with this email address already exists. Please sign in with your email.',
            alreadyRegistered: true,
          },
          { status: 409 }
        );
      }
    }

    // Enforce rate limiting to prevent SMS flooding
    const rateLimitCheck = checkOtpRateLimit(normalizedPhone);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.error,
          waitSeconds: rateLimitCheck.waitSeconds,
        },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP using otplib and create signed verification token
    const otpResult = generatePhoneOtp(normalizedPhone);

    // Dispatch SMS via configured provider or fallback preview mode
    const smsResult = await sendSmsOtp(normalizedPhone, otpResult.otp);

    return NextResponse.json({
      success: true,
      message: smsResult.message,
      phone: normalizedPhone,
      verificationToken: otpResult.verificationToken,
      expiresIn: otpResult.expiresIn,
      devOtp: smsResult.devOtp, // Returned in dev/simulated mode for instant testing
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch verification code. Please try again.' },
      { status: 500 }
    );
  }
}
