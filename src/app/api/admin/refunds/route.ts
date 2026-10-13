import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { listRefundRequests, initiateRefundRequest, approveRefundRequest } from '@/data/admin/refunds';
import { isAdminRole } from '@/lib/permissions/guard';

export async function GET() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const refunds = await listRefundRequests(role);
    return NextResponse.json({ refunds });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to list refunds';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { orderId, amount, reason } = body;
    if (!orderId || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required refund fields' }, { status: 400 });
    }

    const refund = await initiateRefundRequest({
      staffId: session.user.id,
      actorRole: role,
      actorEmail: session.user.email,
      orderId,
      amount: parseFloat(amount),
      reason,
    });

    return NextResponse.json({ refund }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to request refund';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { refundId } = body;
    if (!refundId) return NextResponse.json({ error: 'Refund ID required' }, { status: 400 });

    const refund = await approveRefundRequest({
      ownerId: session.user.id,
      actorRole: role,
      actorEmail: session.user.email,
      refundId,
    });

    return NextResponse.json({ refund });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to approve refund';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
