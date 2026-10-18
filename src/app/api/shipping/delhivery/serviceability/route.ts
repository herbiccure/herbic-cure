import { NextRequest, NextResponse } from 'next/server';
import { checkPincodeServiceability } from '@/lib/shipping/delhivery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode') || '';

    if (!pincode.trim()) {
      return NextResponse.json(
        { error: 'Postal PIN code is required' },
        { status: 400 }
      );
    }

    const result = await checkPincodeServiceability(pincode);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Delhivery serviceability check error:', error);
    return NextResponse.json(
      { error: 'Failed to verify pincode serviceability' },
      { status: 500 }
    );
  }
}
