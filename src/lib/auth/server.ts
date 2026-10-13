import 'server-only';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';

export async function getServerSession() {
  try {
    const reqHeaders = await headers();
    return await auth.api.getSession({
      headers: reqHeaders,
    });
  } catch {
    return null;
  }
}

export async function requireUserSession() {
  const session = await getServerSession();
  if (!session || !session.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
