'use client';

import React from 'react';
import useSWR from 'swr';
import { Mail, CheckCircle2 } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface SubscriberItem {
  id: string;
  email: string;
  subscribedAt: string;
}

export default function AdminSubscribersPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading } = useSWR<{ subscribers: SubscriberItem[] }>(
    '/api/admin/subscribers',
    fetcher
  );
  const subscribers = data?.subscribers ?? [];

  const columns: Column<SubscriberItem>[] = [
    {
      header: 'Email Address',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-rose-600 dark:text-rose-500 shrink-0" />
          <span className={cn('font-medium', isLight ? 'text-slate-900' : 'text-white')}>
            {s.email}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: () => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
            isLight
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-rose-950 text-rose-400 border-rose-800'
          )}
        >
          <CheckCircle2 className="w-3 h-3" />
          Active
        </span>
      ),
    },
    {
      header: 'Subscribed Date',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (s) => (
        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
          {new Date(s.subscribedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className={cn(
            'text-2xl font-bold font-serif',
            isLight ? 'text-slate-900' : 'text-white'
          )}
        >
          Newsletter Subscribers
        </h1>
        <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
          View customer email addresses subscribed to marketing announcements and discounts.
        </p>
      </div>

      <AdminDataTable
        data={subscribers}
        columns={columns}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        searchPlaceholder="Search subscriber email..."
        searchFilter={(s, q) => s.email.toLowerCase().includes(q)}
        emptyMessage="No newsletter subscribers recorded yet."
      />
    </div>
  );
}
