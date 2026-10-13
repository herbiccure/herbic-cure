import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    return await auth.api.signOut({
      headers: req.headers,
      asResponse: true,
    });
  } catch {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('better-auth.session_token');
    res.cookies.delete('admin_session');
    return res;
  }
}
