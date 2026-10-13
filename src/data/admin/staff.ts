import 'server-only';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { assertPermission } from '@/lib/permissions/guard';

export async function listStaffMembers(actorRole: string) {
  assertPermission(actorRole, 'STAFF', 'READ');

  return prisma.user.findMany({
    where: {
      role: { in: ['OWNER', 'MANAGER', 'SUPPORT'] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      twoFactorEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function inviteStaffMember({
  actorId,
  actorRole,
  actorEmail,
  email,
  role,
}: {
  actorId: string;
  actorRole: string;
  actorEmail: string;
  email: string;
  role: 'MANAGER' | 'SUPPORT';
}) {
  assertPermission(actorRole, 'STAFF', 'INVITE');

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing && ['OWNER', 'MANAGER', 'SUPPORT'].includes(existing.role)) {
    throw new Error('This user is already an active staff member.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hour invite validity

  const invite = await prisma.staffInvite.create({
    data: {
      email: normalizedEmail,
      role,
      invitedById: actorId,
      tokenHash: token,
      expiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      actorEmail,
      actorRole,
      action: 'STAFF_INVITED',
      resource: 'StaffInvite',
      resourceId: invite.id,
      diffJson: JSON.stringify({ email: normalizedEmail, role }),
      ipAddress: '127.0.0.1',
      userAgent: 'ADMIN_CONSOLE',
      status: 'SUCCESS',
    },
  });

  return invite;
}

export async function revokeStaffMember({
  actorId,
  actorRole,
  actorEmail,
  targetUserId,
}: {
  actorId: string;
  actorRole: string;
  actorEmail: string;
  targetUserId: string;
}) {
  assertPermission(actorRole, 'STAFF', 'DELETE');

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error('Staff member not found.');

  // CRITICAL LAST-OWNER PROTECTION: Count active owners
  if (target.role === 'OWNER') {
    const activeOwnerCount = await prisma.user.count({
      where: { role: 'OWNER', status: 'ACTIVE' },
    });
    if (activeOwnerCount <= 1) {
      throw new Error('OPERATION ABORTED: Cannot remove or demote the last remaining OWNER of the platform.');
    }
  }

  // Deactivate and terminate sessions immediately
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetUserId },
      data: { status: 'SUSPENDED' },
    });

    await tx.session.deleteMany({
      where: { userId: targetUserId },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        actorEmail,
        actorRole,
        action: 'STAFF_REVOKED',
        resource: 'User',
        resourceId: targetUserId,
        diffJson: JSON.stringify({ revokedEmail: target.email, formerRole: target.role }),
        ipAddress: '127.0.0.1',
        userAgent: 'ADMIN_CONSOLE',
        status: 'SUCCESS',
      },
    });
  });

  return { success: true };
}
