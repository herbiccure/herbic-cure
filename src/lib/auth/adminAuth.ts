import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, AdminSessionPayload } from './session';

/**
 * Extracts and verifies the admin session from request cookies or Next.js cookies()
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

  if (!token) return null;

  return verifySessionToken<AdminSessionPayload>(token);
}

/**
 * In-route authorization guard. Returns null if authorized, or a 401/403 NextResponse if not.
 */
export async function requireAdminAuth(request?: NextRequest, allowedRoles: string[] = ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'STAFF']): Promise<{ session: AdminSessionPayload } | NextResponse> {
  const session = await getAdminSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid admin authentication token required' },
      { status: 401 }
    );
  }

  if (allowedRoles.length > 0 && session.role) {
    const roleUpper = session.role.toUpperCase();
    const hasRole = allowedRoles.some((r) => r.toUpperCase() === roleUpper);
    if (!hasRole && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges for this operation' },
        { status: 403 }
      );
    }
  }

  return { session };
}
