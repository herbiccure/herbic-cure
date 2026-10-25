import { createSafeActionClient } from 'next-safe-action';
import { getServerSession } from '@/lib/auth/server';
import { isAdminRole, assertPermission, ForbiddenError } from '@/lib/permissions/guard';
import { AppResource, AppAction } from '@/lib/permissions/types';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * Base public action client
 */
export const publicActionClient = createSafeActionClient({
  handleServerError: (e) => {
    logger.error('server.action.error', { error: e });
    if (e instanceof ForbiddenError) {
      return e.message;
    }
    return 'An internal server error occurred. Please try again.';
  },
});

/**
 * Authenticated customer action client
 */
export const userActionClient = publicActionClient.use(async ({ next }) => {
  const session = await getServerSession();
  if (!session?.user) {
    throw new ForbiddenError('Authentication required to perform this action.');
  }

  return next({
    ctx: {
      user: session.user,
      session,
    },
  });
});

/**
 * Strict RBAC admin action client with audit logging
 */
export const createAdminActionClient = (resource: AppResource, action: AppAction) => {
  return publicActionClient.use(async ({ next }) => {
    const session = await getServerSession();
    if (!session?.user) {
      throw new ForbiddenError('Admin authentication required.');
    }

    const role = (session.user as { role?: string }).role || 'CUSTOMER';
    if (!isAdminRole(role)) {
      throw new ForbiddenError('Access denied: User is not an authorized staff member.');
    }

    // Verify user is active in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!dbUser || dbUser.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is suspended or deactivated.');
    }

    // Assert permission matrix
    assertPermission(dbUser.role, resource, action);

    const reqHeaders = await headers();
    const ip = reqHeaders.get('x-forwarded-for') || '127.0.0.1';
    const ua = reqHeaders.get('user-agent') || 'ServerAction';

    return next({
      ctx: {
        adminUser: dbUser,
        role: dbUser.role,
        session,
        ip,
        ua,
      },
    });
  });
};
