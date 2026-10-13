import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Edge Proxy (Replaces deprecated middleware convention)
 * Layer 1: Edge Security, Technical SEO Enforcement, Zero-Private-Cache, and Admin Edge Guard.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Trailing Slash Normalization (301 Permanent Redirect to prevent duplicate content)
  if (pathname !== '/' && pathname.endsWith('/') && !pathname.startsWith('/_next')) {
    const cleanUrl = new URL(pathname.slice(0, -1), request.url);
    cleanUrl.search = request.nextUrl.search;
    return NextResponse.redirect(cleanUrl, 301);
  }

  const response = NextResponse.next();

  // 2. Edge Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 3. ZERO-CACHE & INDEXATION CONTROLS
  // Check private, checkout, account, API, and administrative endpoints
  const isPrivateOrTransactional =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/order-success') ||
    pathname.startsWith('/track-order');

  if (isPrivateOrTransactional) {
    // Prevent search indexing on all private/transactional URLs
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

    // Never cache private or customer-specific responses
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
    // Immutable public static asset caching
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // 4. Admin Route Edge Guard
  if (pathname.startsWith('/admin')) {
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
