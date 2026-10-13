import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { listStaffMembers, inviteStaffMember, revokeStaffMember } from '@/data/admin/staff';
import { isAdminRole } from '@/lib/permissions/guard';

export async function GET() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const staff = await listStaffMembers(role);
    return NextResponse.json({ staff });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to list staff';
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
    const { email, role: inviteRole } = body;
    if (!email || !inviteRole) {
      return NextResponse.json({ error: 'Email and role required' }, { status: 400 });
    }

    const invite = await inviteStaffMember({
      actorId: session.user.id,
      actorRole: role,
      actorEmail: session.user.email,
      email,
      role: inviteRole,
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to invite staff';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('id');
  if (!targetUserId) return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });

  try {
    await revokeStaffMember({
      actorId: session.user.id,
      actorRole: role,
      actorEmail: session.user.email,
      targetUserId,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to revoke staff';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
