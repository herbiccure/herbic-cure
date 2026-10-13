import 'server-only';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * DPDP Act 2023 - Right to Data Portability
 * Exports all customer personal data in machine-readable JSON format.
 */
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const [addresses, orders, reviews] = await Promise.all([
    prisma.address.findMany({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      include: { items: true, events: true },
    }),
    prisma.review.findMany({ where: { userId } }),
  ]);

  return {
    exportMetadata: {
      platform: 'Herbic Cure (Ayurvedic E-Commerce)',
      generatedAt: new Date().toISOString(),
      compliance: 'Digital Personal Data Protection Act 2023 (India)',
    },
    profile: user,
    addresses,
    orders,
    reviews,
  };
}

/**
 * DPDP Act 2023 - Right to Erasure / Anonymization
 * Anonymizes customer PII, deletes addresses and sessions,
 * while preserving transactional tax audit trails required under Indian GST law.
 */
export async function anonymizeUserData(userId: string, ipAddress = '127.0.0.1', userAgent = 'Unknown') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const anonymizedHash = crypto.randomBytes(6).toString('hex');
  const anonymizedEmail = `deleted_${anonymizedHash}@anonymized.herbiccure.com`;

  return prisma.$transaction(async (tx) => {
    // 1. Anonymize user table entry
    await tx.user.update({
      where: { id: userId },
      data: {
        name: 'Anonymized Customer',
        email: anonymizedEmail,
        phone: null,
        image: null,
        status: 'DELETED',
      },
    });

    // 2. Remove all addresses
    await tx.address.deleteMany({
      where: { userId },
    });

    // 3. Anonymize PII in past orders while maintaining accounting totals & tax figures
    await tx.order.updateMany({
      where: { userId },
      data: {
        customerName: 'Anonymized Customer',
        customerEmail: anonymizedEmail,
        customerPhone: '0000000000',
        shippingAddress: JSON.stringify({ anonymized: true, city: 'Redacted', state: 'India' }),
        billingAddress: null,
      },
    });

    // 4. Revoke all active sessions and accounts
    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });

    // 5. Append audit log entry
    await tx.auditLog.create({
      data: {
        actorId: userId,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'DPDP_ACCOUNT_ANONYMIZED',
        resource: 'User',
        resourceId: userId,
        diffJson: JSON.stringify({ originalEmail: user.email, anonymizedEmail }),
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      },
    });

    return { success: true };
  });
}
