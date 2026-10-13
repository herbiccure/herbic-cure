import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { adminLoginSchema } from '@/lib/validations';
import { signSessionToken } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting: max 10 login attempts per minute per IP
    const rateLimitError = enforceRateLimit(request, 'admin_login', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    // 2. Schema validation
    const body = await request.json().catch(() => null);
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid email or password format' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 3. User lookup
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin || !admin.active) {
      return NextResponse.json(
        { error: 'Invalid credentials or inactive administrator account' },
        { status: 401 }
      );
    }

    // 4. Secure bcrypt password verification
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const adminSession = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    // 5. Cryptographic HMAC-SHA256 Signed Session Token
    const signedToken = signSessionToken(adminSession);

    const response = NextResponse.json({
      success: true,
      admin: adminSession,
    });

    // 6. Secure, httpOnly Cookie
    response.cookies.set('admin_session', signedToken, {
      httpOnly: true, // Prevents XSS cookie theft
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Server authentication error' }, { status: 500 });
  }
}
