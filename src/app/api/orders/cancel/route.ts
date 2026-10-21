import { NextRequest, NextResponse } from 'next/server';
import { POST as handleCancelById } from '@/app/api/orders/[id]/cancel/route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const clone = request.clone();
    const body = await clone.json().catch(() => ({}));
    const orderId = body.orderId || body.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    return handleCancelById(request, {
      params: Promise.resolve({ id: String(orderId).trim() }),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process cancellation' },
      { status: 500 }
    );
  }
}
