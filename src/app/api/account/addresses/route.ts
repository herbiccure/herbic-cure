import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { getUserAddresses, createUserAddress, updateUserAddress, deleteUserAddress } from '@/data/user/addresses';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const addresses = await getUserAddresses(session.user.id);
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const address = await createUserAddress(session.user.id, body);
    return NextResponse.json({ address }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : null) || 'Failed to create address' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

    const address = await updateUserAddress(session.user.id, id, data);
    return NextResponse.json({ address });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : null) || 'Failed to update address' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

  try {
    await deleteUserAddress(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : null) || 'Failed to delete address' }, { status: 400 });
  }
}
