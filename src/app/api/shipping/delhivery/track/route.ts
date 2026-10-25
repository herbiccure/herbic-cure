import { logger } from '@/lib/logger';
﻿import { NextRequest, NextResponse } from 'next/server';
import { trackDelhiveryShipment } from '@/lib/shipping/delhivery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const waybill = searchParams.get('waybill') || searchParams.get('wbn') || '';

    if (!waybill.trim()) {
      return NextResponse.json(
        { error: 'Delhivery Waybill / AWB number is required' },
        { status: 400 }
      );
    }

    const trackingResult = await trackDelhiveryShipment(waybill);
    return NextResponse.json(trackingResult);
  } catch (error: any) {
    logger.error('shipping.delhivery.tracking_failed', { error });
    return NextResponse.json(
      { error: 'Failed to retrieve Delhivery shipment updates' },
      { status: 500 }
    );
  }
}
