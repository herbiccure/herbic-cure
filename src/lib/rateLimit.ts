import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window cache with self-pruning
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000).unref?.();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit = 10, windowMs = 60 * 1000): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetAt) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitMap.set(key, record);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt: record.resetAt,
    };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function getClientIp(req: NextRequest | Request): string {
  const forwarded = (req.headers as any).get?.('x-forwarded-for') || (req.headers as any)['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = (req.headers as any).get?.('x-real-ip') || (req.headers as any)['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export function enforceRateLimit(
  req: NextRequest | Request,
  action: string,
  limit = 10,
  windowMs = 60 * 1000
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${action}:${ip}`;
  const result = rateLimit(key, limit, windowMs);

  if (!result.success) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
