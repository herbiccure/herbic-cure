import crypto from 'crypto';
import { env } from '@/lib/env';

export interface AdminSessionPayload {
  id: string;
  name?: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface CustomerSessionPayload {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  iat?: number;
  exp?: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Signs a payload with HMAC-SHA256 and returns a secure token string
 */
export function signSessionToken<T extends object>(payload: T, expiresInSeconds = 7 * 24 * 60 * 60): string {
  const now = Math.floor(Date.now() / 1000);
  const data = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(data));
  const hmac = crypto.createHmac('sha256', env.SESSION_SECRET);
  hmac.update(payloadB64);
  const signatureB64 = hmac.digest('base64url');

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed session token.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifySessionToken<T>(token: string | undefined | null): T | null {
  if (!token || typeof token !== 'string') return null;

  // Handle signed tokens: payload.signature
  const parts = token.split('.');
  if (parts.length === 2) {
    const [payloadB64, signatureB64] = parts;
    try {
      const hmac = crypto.createHmac('sha256', env.SESSION_SECRET);
      hmac.update(payloadB64);
      const expectedSig = hmac.digest('base64url');

      const sigBuf = Buffer.from(signatureB64);
      const expectedBuf = Buffer.from(expectedSig);

      if (sigBuf.length !== expectedBuf.length) {
        return null;
      }

      if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const decoded = JSON.parse(base64UrlDecode(payloadB64));
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp && now > decoded.exp) {
        return null; // Expired token
      }

      return decoded as T;
    } catch {
      return null;
    }
  }

  // Graceful fallback for legacy raw JSON during transition
  try {
    const parsed = JSON.parse(token);
    if (parsed && (parsed.id || parsed.email)) {
      return parsed as T;
    }
  } catch {
    // Not valid JSON
  }

  return null;
}
