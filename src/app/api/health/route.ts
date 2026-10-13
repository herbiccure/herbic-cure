import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';

  try {
    // Quick, non-leaking ping to SQLite database
    await prisma.$queryRawUnsafe('SELECT 1');
  } catch {
    dbStatus = 'degraded';
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      service: 'herbic-cure-api',
      timestamp: new Date().toISOString(),
      latencyMs: responseTimeMs,
      environment: process.env.NODE_ENV || 'development',
    },
    {
      status: dbStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
