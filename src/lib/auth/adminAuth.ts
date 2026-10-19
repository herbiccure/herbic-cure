import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifySessionToken, AdminSessionPayload } from './session';
import { auth } from '@/lib/auth/auth';
import { isAdminRole } from '@/lib/permissions/guard';

/**
 * Extracts and verifies the admin session from request cookies, Next.js cookies(),
 * or Better-Auth session fallback.
 */
export async function getAdminSession(request?: NextRequest): Promise<AdminSessionPayload | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get('admin_session')?.value;
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('admin_session')?.value;
    } catch {
      // In certain server contexts cookies() may throw
    }
  }

  if (token) {
    const verified = verifySessionToken<AdminSessionPayload>(token);
    if (verified && isAdminRole(verified.role)) return verified;
  }

  // Fallback to Better Auth session
  try {
    const reqHeaders = request ? request.headers : await headers();
    const betterSession = await auth.api.getSession({
      headers: reqHeaders,
    });
    if (betterSession?.user) {
      const u = betterSession.user as any;
      if (isAdminRole(u.role)) {
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
        };
      }
    }
  } catch {
    // Better auth check failed
  }

  return null;
}

/**
 * In-route authorization guard. Returns null if authorized, or a 401/403 NextResponse if not.
 */
export async function requireAdminAuth(
  request?: NextRequest,
  allowedRoles: string[] = ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STORE_MANAGER', 'STAFF', 'SUPPORT']
): Promise<{ session: AdminSessionPayload } | NextResponse> {
  const session = await getAdminSession(request);

  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid admin authentication token required' },
      { status: 401 }
    );
  }

  const roleUpper = session.role.toUpperCase();
  if (roleUpper === 'CUSTOMER' || roleUpper === 'USER') {
    return NextResponse.json(
      { error: 'Forbidden: Customer accounts are strictly prohibited from administrative operations' },
      { status: 403 }
    );
  }

  if (allowedRoles.length > 0 && session.role) {
    const hasRole = allowedRoles.some((r) => r.toUpperCase() === roleUpper);
    if (!hasRole && roleUpper !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges for this operation' },
        { status: 403 }
      );
    }
  }

  return { session };
}
