import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { anonymizeUserData } from '@/data/user/dpdp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const ua = req.headers.get('user-agent') || 'Browser';

  try {
    await anonymizeUserData(session.user.id, ip, ua);
    return NextResponse.json({ success: true, message: 'Account permanently anonymized under DPDP Act 2023' });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : null) || 'Failed to anonymize account' }, { status: 500 });
  }
}
