'use client';

import React from 'react';
import useSWR from 'swr';
import { Mail, Phone, Calendar } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface SubmissionItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminContactSubmissionsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading } = useSWR<{ submissions: SubmissionItem[] }>(
    '/api/admin/contact-submissions',
    fetcher
  );
  const submissions = data?.submissions ?? [];

  const columns: Column<SubmissionItem>[] = [
    {
      header: 'Customer',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (s) => (
        <div>
          <span className={cn('font-bold block', isLight ? 'text-slate-900' : 'text-white')}>
            {s.name}
          </span>
          <span className="text-[11px] text-slate-500">{s.email}</span>
          {s.phone && (
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-mono">
              {s.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Subject',
      cell: (s) => (
        <span className={cn('font-semibold block', isLight ? 'text-slate-900' : 'text-white')}>
          {s.subject}
        </span>
      ),
    },
    {
      header: 'Message',
      cell: (s) => (
        <p className={cn('line-clamp-2 text-[11px] max-w-sm leading-relaxed', isLight ? 'text-slate-600' : 'text-slate-300')}>
          {s.message}
        </p>
      ),
    },
    {
      header: 'Received',
      cell: (s) => (
        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
          {new Date(s.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (s) => (
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
            isLight
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-rose-950 text-rose-400 border-rose-800'
          )}
        >
          {s.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold font-serif', isLight ? 'text-slate-900' : 'text-white')}>
          Contact Inquiries &amp; Leads
        </h1>
        <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
          Customer messages received via the public contact form.
        </p>
      </div>

      <AdminDataTable
        data={submissions}
        columns={columns}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        searchPlaceholder="Search customer, email, subject..."
        searchFilter={(s, q) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.subject.toLowerCase().includes(q) ||
          s.message.toLowerCase().includes(q)
        }
        emptyMessage="No customer inquiries received yet."
      />
    </div>
  );
}
