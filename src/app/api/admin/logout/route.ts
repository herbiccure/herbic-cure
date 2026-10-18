import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const res = await auth.api.signOut({
      headers: req.headers,
      asResponse: true,
    });
    const nextRes = new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
    nextRes.cookies.delete('admin_session');
    return nextRes;
  } catch {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('better-auth.session_token');
    res.cookies.delete('admin_session');
    return res;
  }
}
