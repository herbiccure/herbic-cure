import 'server-only';
import { prisma } from '@/lib/prisma';

export async function getUserOrders(userId: string, email?: string) {
  let userEmail = email?.toLowerCase().trim();
  if (!userEmail && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      userEmail = user.email.toLowerCase().trim();
    }
  }

  // Auto-backfill userId on any unassigned orders with matching email
  if (userEmail && userId) {
    try {
      await prisma.order.updateMany({
        where: {
          customerEmail: userEmail,
          userId: null,
        },
        data: {
          userId,
        },
      });
    } catch {
      // Non-critical backfill
    }
  }

  return prisma.order.findMany({
    where: {
      OR: [
        { userId },
        ...(userEmail ? [{ customerEmail: userEmail }] : []),
      ],
    },
    include: {
      items: true,
      events: { orderBy: { timestamp: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserOrderById(userId: string, orderId: string, email?: string) {
  let userEmail = email?.toLowerCase().trim();
  if (!userEmail && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      userEmail = user.email.toLowerCase().trim();
    }
  }

  return prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [
        { userId },
        ...(userEmail ? [{ customerEmail: userEmail }] : []),
      ],
    },
    include: {
      items: true,
      events: { orderBy: { timestamp: 'desc' } },
    },
  });
}