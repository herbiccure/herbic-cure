import { GET as getHandler, POST as postHandler } from '@/app/api/shipping/delhivery/webhook/route';

export const dynamic = 'force-dynamic';

/**
 * Delhivery Logistics Webhook Canonical Alias
 * Allows webhook configurations pointed to /api/webhooks/delhivery to function identically.
 */
export async function POST(req: any) {
  return postHandler(req);
}

export async function GET() {
  return getHandler();
}
