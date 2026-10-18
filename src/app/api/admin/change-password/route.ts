import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as argon2 from '@node-rs/argon2';
import { isAdminRole } from '@/lib/permissions/guard';
import { enforceRateLimit } from '@/lib/rateLimit';
import { verifySessionToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting: max 5 password change attempts per 5 minutes per IP
    const rateLimitError = enforceRateLimit(request, 'admin_change_password', 5, 5 * 60 * 1000);
    if (rateLimitError) return rateLimitError;

    const body = await request.json().catch(() => ({}));
    const { email, currentPassword, newPassword, confirmPassword, recoveryKey } = body;

    // Check if request comes from an authenticated session cookie
    const adminSessionCookie = request.cookies.get('admin_session')?.value;
    let sessionUser: any = null;
    if (adminSessionCookie) {
      sessionUser = verifySessionToken(adminSessionCookie);
    }

    const targetEmail = (email || sessionUser?.email || '').trim().toLowerCase();

    if (!targetEmail) {
      return NextResponse.json({ error: 'Admin email is required.' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    // Lookup user in DB
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { accounts: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Admin account not found or inactive.' },
        { status: 404 }
      );
    }

    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Access Denied: Not an administrator account.' },
        { status: 403 }
      );
    }

    const credentialAccount = user.accounts.find((a) => a.providerId === 'credential');
    if (!credentialAccount) {
      return NextResponse.json(
        { error: 'No credential account associated with this administrator.' },
        { status: 400 }
      );
    }

    // Verify Authorization: Either Current Password, Master Recovery Key, or Valid Active Session
    let isAuthorized = false;

    // A) If recovery key is provided, check against SESSION_SECRET or BETTER_AUTH_SECRET
    const validRecoveryKeys = [
      process.env.SESSION_SECRET,
      process.env.BETTER_AUTH_SECRET,
    ].filter(Boolean);

    if (recoveryKey && validRecoveryKeys.length > 0) {
      const cleanKey = recoveryKey.trim();
      if (validRecoveryKeys.some((k) => k === cleanKey || k?.slice(0, 16) === cleanKey)) {
        isAuthorized = true;
      }
    }

    // B) Verify current password if provided
    if (!isAuthorized && currentPassword) {
      if (credentialAccount.passwordHash) {
        const valid = await argon2.verify(credentialAccount.passwordHash, currentPassword);
        if (valid) isAuthorized = true;
      }
    }

    // C) If user is already authenticated as this admin
    if (!isAuthorized && sessionUser && sessionUser.id === user.id) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to confirm identity.' },
          { status: 400 }
        );
      }
      if (credentialAccount.passwordHash) {
        const valid = await argon2.verify(credentialAccount.passwordHash, currentPassword);
        if (valid) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Invalid current password or authorization key. If you forgot your password, contact support or provide the master secret.',
        },
        { status: 401 }
      );
    }

    // Hash the new password using Argon2
    const hashed = await argon2.hash(newPassword);

    // Update credential account in database
    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: {
        passwordHash: hashed,
        password: hashed,
        passwordResetRequired: false,
        updatedAt: new Date(),
      },
    });

    // Record audit log
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'Browser';
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'ADMIN_PASSWORD_CHANGED',
          resource: 'User',
          resourceId: user.id,
          ipAddress: ip,
          userAgent: ua,
          status: 'SUCCESS',
        },
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated! You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update security password.' },
      { status: 500 }
    );
  }
}
