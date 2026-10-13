import 'server-only';
import { prisma } from '@/lib/prisma';

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      events: { orderBy: { timestamp: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserOrderById(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: true,
      events: { orderBy: { timestamp: 'desc' } },
    },
  });
}
