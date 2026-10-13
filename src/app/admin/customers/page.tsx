'use client';

import React from 'react';
import useSWR from 'swr';
import { Users, Mail, Phone, ShoppingBag, IndianRupee } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  orders: { id: string; total: number; createdAt: string }[];
}

export default function AdminCustomersPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading } = useSWR<{ customers: CustomerItem[] }>(
    '/api/admin/customers',
    fetcher
  );
  const customers = data?.customers ?? [];

  const columns: Column<CustomerItem>[] = [
    {
      header: 'Customer',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0',
              isLight
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-rose-950 text-rose-400 border-rose-800'
            )}
          >
            {c.name ? c.name[0]?.toUpperCase() : 'U'}
          </div>
          <div>
            <span
              className={cn(
                'font-bold block',
                isLight ? 'text-slate-900' : 'text-white'
              )}
            >
              {c.name}
            </span>
            <span className="text-[11px] text-slate-500">{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      cell: (c) => (
        <span className={cn('font-mono text-[11px]', isLight ? 'text-slate-600' : 'text-slate-400')}>
          {c.phone || '—'}
        </span>
      ),
    },
    {
      header: 'Orders Placed',
      cell: (c) => (
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
            isLight
              ? 'bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          )}
        >
          {c.orders?.length || 0} orders
        </span>
      ),
    },
    {
      header: 'Total Spent',
      cell: (c) => {
        const total = (c.orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
        return (
          <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 font-mono">
            ₹{total.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Registered Date',
      headerClassName: 'px-4 sm:px-6',
      className: 'px-4 sm:px-6',
      cell: (c) => (
        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
          {new Date(c.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
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
          Registered Customers
        </h1>
        <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
          View customer accounts, contact details, total orders placed, and lifetime revenue.
        </p>
      </div>

      <AdminDataTable
        data={customers}
        columns={columns}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        searchPlaceholder="Search customer name, email, phone..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone ? c.phone.toLowerCase().includes(q) : false)
        }
        emptyMessage="No registered customers found yet."
      />
    </div>
  );
}
