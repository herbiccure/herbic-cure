import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { getAuditLogs } from '@/data/admin/audit';
import { isAdminRole } from '@/lib/permissions/guard';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource') || undefined;
  const action = searchParams.get('action') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const data = await getAuditLogs(role, { resource, action, limit, offset });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to get audit logs';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
