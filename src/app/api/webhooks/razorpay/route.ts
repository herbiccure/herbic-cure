import { NextRequest, NextResponse } from 'next/server';
export { POST } from '@/app/api/payment/razorpay/webhook/route';

export const dynamic = 'force-dynamic';

/**
 * Health check & status endpoint for Razorpay Webhook
 * GET /api/webhooks/razorpay
 */
export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Herbic Cure Razorpay Webhook Service',
    timestamp: new Date().toISOString(),
  });
}
