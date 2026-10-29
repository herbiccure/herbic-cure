import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Customer Phone OTP Dispatch (Decommissioned)
 * SMS OTP service has been removed per store policy to eliminate SMS provider fees and prevent bot abuse.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'SMS OTP service is disabled. Please register or sign in with your email and password.',
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'SMS OTP service is disabled.',
    },
    { status: 410 }
  );
}
