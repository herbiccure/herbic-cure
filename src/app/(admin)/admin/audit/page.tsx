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
          className="p-2.5 bg-white border border-[#EAC9D1] rounded-xl text-xs w-64 text-[#2D1B1B] font-medium placeholder:text-[#9C7A84] focus:outline-none focus:ring-2 focus:ring-[#8C3A4F] shadow-2xs"
        />
        <input
          placeholder="Filter by resource (e.g. User, Order)..."
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
          className="p-2.5 bg-white border border-[#EAC9D1] rounded-xl text-xs w-64 text-[#2D1B1B] font-medium placeholder:text-[#9C7A84] focus:outline-none focus:ring-2 focus:ring-[#8C3A4F] shadow-2xs"
        />
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-rose-700" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#EAC9D1] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="bg-[#FCF4F7] border-b border-[#EAC9D1] text-[#45363B] uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="p-4 whitespace-nowrap">Timestamp</th>
                <th className="p-4 whitespace-nowrap">Actor</th>
                <th className="p-4 whitespace-nowrap">Role</th>
                <th className="p-4 whitespace-nowrap">Action</th>
                <th className="p-4 whitespace-nowrap">Resource</th>
                <th className="p-4 whitespace-nowrap">IP</th>
                <th className="p-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 text-[#7A5B64] font-medium whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 font-bold text-[#2D1B1B] whitespace-nowrap">{log.actorEmail}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#F6DFE7] text-[#8C3A4F] border border-[#EAC9D1]">{log.actorRole}</span>
                  </td>
                  <td className="p-4 font-mono font-black text-[#8C3A4F] whitespace-nowrap">{log.action}</td>
                  <td className="p-4 font-semibold text-[#45363B] whitespace-nowrap">{log.resource}</td>
                  <td className="p-4 text-[#7A5B64] font-mono text-xs whitespace-nowrap">{log.ipAddress}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
