import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, AdminSessionPayload } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin and /api/admin routes
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  // Allow login page and login API endpoint
  const isLoginPage = pathname === '/admin/login';
  const isLoginApi = pathname === '/api/admin/login';

  const sessionCookie = request.cookies.get('admin_session')?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    const verifiedSession = verifySessionToken<AdminSessionPayload>(sessionCookie);
    if (verifiedSession && (verifiedSession.id || verifiedSession.email)) {
      isAuthenticated = true;
    }
  }

  // If trying to access API route without authentication
  if (isAdminApi) {
    if (isLoginApi) {
      return NextResponse.next();
    }
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid admin authentication token required' },
        { status: 401 }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  // Handle /admin page routes
  if (isAdminPage) {
    // If not authenticated and trying to access any admin page other than /admin/login
    if (!isAuthenticated) {
      if (isLoginPage) {
        const response = NextResponse.next();
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return response;
      }
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('from', pathname);
      }
      const response = NextResponse.redirect(loginUrl);
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return response;
    }

    // If authenticated and visiting /admin/login, redirect to /admin
    if (isAuthenticated && isLoginPage) {
      const response = NextResponse.redirect(new URL('/admin', request.url));
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  return NextResponse.next();
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
