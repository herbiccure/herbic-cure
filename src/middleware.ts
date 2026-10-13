import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global Edge Security & Caching Middleware
 * Layer 1: Edge headers and zero-private-cache enforcement.
 */
export function middleware(request: NextRequest) {
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
    // Strictly forbid browser and CDN (Cloudflare) caching
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
    // Static assets: Long-lived immutable cache
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for Next.js internal files
     */
    '/((?!_next/image|favicon.ico).*)',
  ],
};
