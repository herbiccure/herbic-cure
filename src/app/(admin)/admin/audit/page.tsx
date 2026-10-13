'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Loader2 } from 'lucide-react';

interface AuditLogItem {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: string;
  timestamp: string;
  diffJson?: string | null;
}

export default function AdminAuditPage() {
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');

  const url = `/api/admin/audit?limit=50${filterAction ? `&action=${filterAction}` : ''}${filterResource ? `&resource=${filterResource}` : ''}`;
  const { data, isLoading } = useSWR<{ logs: AuditLogItem[]; total: number }>(url, fetcher);
  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">Audit Trail</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable log of all administrative actions, logins, status changes, and refunds
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Filter by action (e.g. REFUND, STAFF)..."
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs w-64"
        />
        <input
          placeholder="Filter by resource (e.g. User, Order)..."
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs w-64"
        />
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-rose-700" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Resource</th>
                <th className="p-4">IP</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{log.actorEmail}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{log.action}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{log.resource}</td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">{log.ipAddress}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
