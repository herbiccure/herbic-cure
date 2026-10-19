import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as argon2 from '@node-rs/argon2';
import { auth } from '@/lib/auth/auth';
import { isAdminRole } from '@/lib/permissions/guard';
import { enforceRateLimit } from '@/lib/rateLimit';
import { signSessionToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting: max 10 admin attempts per minute
    const rateLimitError = enforceRateLimit(request, 'admin_login', 10, 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Lookup in unified User table
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { accounts: true },
    });

    if (!user) {
      // Check if account exists in Customer storefront table
      const customerRecord = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            { phone: cleanEmail.replace(/\D/g, '').slice(-10) }
          ]
        },
      });

      if (customerRecord) {
        return NextResponse.json(
          { error: 'Access Denied: Customer storefront accounts cannot access the administrative console.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is inactive. Please contact system administrator.' }, { status: 403 });
    }

    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Access Denied: Customer accounts are strictly prohibited from logging into the administrative console.' },
        { status: 403 }
      );
    }

    // 3. Verify password hash
    const credentialAccount = user.accounts.find((a) => a.providerId === 'credential');
    if (!credentialAccount || !credentialAccount.passwordHash) {
      return NextResponse.json({ error: 'Invalid authentication provider' }, { status: 401 });
    }

    const valid = await argon2.verify(credentialAccount.passwordHash, password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 4. Create Better Auth session via internal API
    const sessionRes = await auth.api.signInEmail({
      body: { email: cleanEmail, password },
      asResponse: true,
    });

    // Audit log successful admin sign-in
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'Browser';
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'ADMIN_LOGIN_SUCCESS',
        resource: 'Session',
        resourceId: user.id,
        ipAddress: ip,
        userAgent: ua,
        status: 'SUCCESS',
      },
    });

    // Set admin_session cookie for direct API route authorization
    const adminToken = signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name || 'Admin User',
      role: user.role,
    });

    const nextRes = new NextResponse(sessionRes.body, {
      status: sessionRes.status,
      statusText: sessionRes.statusText,
      headers: sessionRes.headers,
    });

    nextRes.cookies.set('admin_session', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return nextRes;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal authentication error' }, { status: 500 });
  }
}
