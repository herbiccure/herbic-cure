import 'server-only';
import { prisma } from '@/lib/prisma';
import { assertPermission } from '@/lib/permissions/guard';

export interface AuditLogFilter {
  actorId?: string;
  resource?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(actorRole: string, filter: AuditLogFilter = {}) {
  assertPermission(actorRole, 'AUDIT_LOG', 'READ');

  const limit = Math.min(filter.limit || 50, 100);
  const offset = filter.offset || 0;

  const where: Record<string, string> = {};
  if (filter.actorId) where.actorId = filter.actorId;
  if (filter.resource) where.resource = filter.resource;
  if (filter.action) where.action = filter.action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, limit, offset };
}

export async function createAuditLogEntry(data: {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  diffJson?: string | null;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: data.actorId,
      actorEmail: data.actorEmail,
      actorRole: data.actorRole,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      diffJson: data.diffJson,
      ipAddress: data.ipAddress || '127.0.0.1',
      userAgent: data.userAgent || 'Server',
      status: data.status || 'SUCCESS',
    },
  });
}
