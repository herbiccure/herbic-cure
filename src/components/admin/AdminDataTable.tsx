'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAdminTheme } from './AdminThemeProvider';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  statusTabs?: string[];
  statusTabLabels?: Record<string, string>;
  activeStatus?: string;
  onStatusChange?: (status: string) => void;
  statusFilter?: (item: T, status: string) => boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  headerAction?: React.ReactNode;
  topContent?: React.ReactNode;
  className?: string;
}

export function AdminDataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  searchPlaceholder = 'Search...',
  searchFilter,
  statusTabs,
  statusTabLabels,
  activeStatus,
  onStatusChange,
  statusFilter: customStatusFilter,
  emptyMessage = 'No records found.',
  emptyAction,
  headerAction,
  topContent,
  className,
}: AdminDataTableProps<T>) {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [query, setQuery] = useState('');

  const filteredData = useMemo(() => {
    let result = data;
    if (activeStatus && customStatusFilter && activeStatus !== 'ALL') {
      result = result.filter((item) => customStatusFilter(item, activeStatus));
    }
    if (query.trim() && searchFilter) {
      const q = query.trim().toLowerCase();
      result = result.filter((item) => searchFilter(item, q));
    }
    return result;
  }, [data, query, searchFilter, activeStatus, customStatusFilter]);

  return (
    <div className={cn('space-y-4', className)}>
      {topContent}

      {/* Filter Tabs & Search Bar */}
      {(statusTabs || searchFilter || headerAction) && (
        <div
          className={cn(
            'p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border transition-colors',
            isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900 border-slate-800'
          )}
        >
          {statusTabs && onStatusChange && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onStatusChange(tab)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer',
                    activeStatus === tab
                      ? isLight
                        ? 'bg-rose-50 text-rose-800 border border-rose-300'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  {statusTabLabels?.[tab] || tab}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 ml-auto flex-1 sm:flex-initial justify-end">
            {searchFilter && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={cn(
                    'w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition-colors outline-hidden',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500'
                  )}
                />
              </div>
            )}
            {headerAction}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div
        className={cn(
          'rounded-3xl border overflow-hidden shadow-xs transition-colors',
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        )}
      >
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <span className="inline-block w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading records...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-3">
            <p>{query ? `No items match "${query}".` : emptyMessage}</p>
            {emptyAction}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={cn(
                    'border-b uppercase font-semibold text-[11px] tracking-wider',
                    isLight
                      ? 'bg-slate-50/80 border-slate-200 text-slate-700'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  )}
                >
                  {columns.map((col, idx) => (
                    <th key={idx} className={cn('py-3.5 px-4', col.headerClassName)}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className={cn(
                  'divide-y',
                  isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/60 text-slate-300'
                )}
              >
                {filteredData.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className={cn(
                      'transition-colors',
                      isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/40'
                    )}
                  >
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className={cn('py-3.5 px-4', col.className)}>
                        {col.cell ? col.cell(item) : String((item as any)[col.accessorKey ?? ''] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
