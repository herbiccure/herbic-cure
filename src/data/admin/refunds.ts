import 'server-only';
import { prisma } from '@/lib/prisma';
import { assertPermission } from '@/lib/permissions/guard';

export async function listRefundRequests(actorRole: string) {
  assertPermission(actorRole, 'REFUND', 'READ');

  return prisma.refundRequest.findMany({
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function initiateRefundRequest({
  staffId,
  actorRole,
  actorEmail,
  orderId,
  amount,
  reason,
}: {
  staffId: string;
  actorRole: string;
  actorEmail: string;
  orderId: string;
  amount: number;
  reason: string;
}) {
  assertPermission(actorRole, 'REFUND', 'CREATE');

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');

  if (amount > order.total) {
    throw new Error('Refund amount cannot exceed order total');
  }

  const refund = await prisma.refundRequest.create({
    data: {
      orderId,
      amount,
      reason,
      requestedBy: staffId,
      status: 'PENDING',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: staffId,
      actorEmail,
      actorRole,
      action: 'REFUND_REQUESTED',
      resource: 'RefundRequest',
      resourceId: refund.id,
      diffJson: JSON.stringify({ orderId, orderNumber: order.orderNumber, amount, reason }),
      ipAddress: '127.0.0.1',
      userAgent: 'ADMIN_CONSOLE',
      status: 'SUCCESS',
    },
  });

  return refund;
}

export async function approveRefundRequest({
  ownerId,
  actorRole,
  actorEmail,
  refundId,
}: {
  ownerId: string;
  actorRole: string;
  actorEmail: string;
  refundId: string;
}) {
  // STRICT OWNER-ONLY APPROVAL
  assertPermission(actorRole, 'REFUND', 'APPROVE');

  const refund = await prisma.refundRequest.findUnique({
    where: { id: refundId },
    include: { order: true },
  });

  if (!refund) throw new Error('Refund request not found');
  if (refund.status !== 'PENDING') throw new Error('Refund has already been processed');

  return prisma.$transaction(async (tx) => {
    const updatedRefund = await tx.refundRequest.update({
      where: { id: refundId },
      data: {
        status: 'APPROVED',
        approvedBy: ownerId,
      },
    });

    await tx.order.update({
      where: { id: refund.orderId },
      data: {
        orderStatus: 'REFUNDED',
        paymentStatus: 'REFUNDED',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: ownerId,
        actorEmail,
        actorRole,
        action: 'REFUND_APPROVED',
        resource: 'RefundRequest',
        resourceId: refund.id,
        diffJson: JSON.stringify({
          refundId,
          orderNumber: refund.order.orderNumber,
          amount: refund.amount,
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'ADMIN_CONSOLE',
        status: 'SUCCESS',
      },
    });

    return updatedRefund;
  });
}
