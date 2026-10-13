import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { exportUserData } from '@/data/user/dpdp';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await exportUserData(session.user.id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="herbic-cure-data-export-${session.user.id}.json"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : null) || 'Data export failed' }, { status: 500 });
  }
}
