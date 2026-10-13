import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { getUserOrders } from '@/data/user/orders';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await getUserOrders(session.user.id, session.user.email);
  return NextResponse.json({ orders });
}