import { NextRequest } from 'next/server';
import { POST as handler } from '@/app/api/admin/orders/request-pickup/route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handler(request);
}

