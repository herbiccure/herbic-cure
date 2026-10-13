'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Plus, Trash2, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'SUPPORT';
  status: 'ACTIVE' | 'SUSPENDED';
  twoFactorEnabled: boolean;
  createdAt: string;
}

export default function AdminStaffPage() {
  const { data, isLoading, mutate } = useSWR<{ staff: StaffUser[] }>('/api/admin/staff', fetcher);
  const staff = data?.staff || [];

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'SUPPORT'>('SUPPORT');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to send invite');

      toast.success('Staff invitation generated successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error sending invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you wish to revoke administrative access for ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to revoke staff');

      toast.success('Staff member suspended and sessions revoked.');
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error revoking staff');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">Staff & Roles</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Role-Based Access Control (RBAC): OWNER, MANAGER, SUPPORT
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      {showInviteModal && (
        <form onSubmit={handleInvite} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Send Administrative Invite</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="email"
              required
              placeholder="staff@herbiccure.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'MANAGER' | 'SUPPORT')}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="SUPPORT">SUPPORT (Orders & Customers read-only)</option>
              <option value="MANAGER">MANAGER (Catalog, CMS, Inventory, Orders)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              {inviting ? 'Generating...' : 'Issue Invite'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-rose-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((u) => (
            <div
              key={u.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'OWNER'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : u.role === 'MANAGER'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {u.role}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-3">{u.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.email}</p>

                <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>2FA: {u.twoFactorEnabled ? 'Enrolled' : 'Pending Enrollment'}</span>
                </div>
              </div>

              {u.role !== 'OWNER' && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => handleRevoke(u.id, u.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Revoke Staff Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
