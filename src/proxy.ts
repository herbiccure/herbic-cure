import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Edge Proxy (Replaces deprecated middleware convention)
 * Layer 1: Edge Security, Zero-Private-Cache Enforcement, and Admin Edge Guard.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Edge Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 2. ZERO-CACHE on Private, Admin, Account, Payment, and Orders Routes
  const isPrivateOrMoney =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/api/account') ||
    pathname.startsWith('/api/orders') ||
    pathname.startsWith('/api/payment') ||
    pathname.startsWith('/api/auth');

  if (isPrivateOrMoney) {
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, max-age=0, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
  } else if (
    pathname.startsWith('/images/') ||
    pathname.startsWith('/_next/static/') ||
    pathname.match(/\.(jpg|jpeg|png|webp|svg|ico|css|js)$/)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // 3. Admin Route Edge Guard
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');

    const hasBetterAuthSession = request.cookies.has('better-auth.session_token');
    const hasAdminSession = request.cookies.has('admin_session');
    const isAuthenticated = hasBetterAuthSession || hasAdminSession;
    const isLoginPage = pathname === '/admin/login';

    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('from', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ['/((?!_next/image|favicon.ico).*)'],
};
