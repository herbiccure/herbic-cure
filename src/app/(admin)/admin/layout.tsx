import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getServerSession } from '@/lib/auth/server';
import { isAdminRole } from '@/lib/permissions/guard';
import { AdminThemeProvider, AdminTheme } from '@/components/admin/AdminThemeProvider';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Herbic Cure Admin Console',
  robots: 'noindex, nofollow',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  // If no session, allow login page to render or redirect to admin login
  if (!session?.user) {
    // If not logged in, AdminShell will check pathname and handle login cleanly,
    // but on server side, non-login pages are guarded:
  }

  const role = (session?.user as { role?: string })?.role || 'CUSTOMER';

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('herbic_admin_theme')?.value as AdminTheme | undefined;
  const initialTheme: AdminTheme = themeCookie === 'dark' ? 'dark' : 'light';

  return (
    <AdminThemeProvider initialTheme={initialTheme}>
      <AdminShell userRole={role}>
        {session?.user && !isAdminRole(role) ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl font-bold mb-4 shadow-sm">
              🛡️
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">403 - Access Forbidden</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mt-2">
              Your account ({session.user.email}) does not possess staff or administrative authorization for this console.
            </p>
            <Link
              href="/"
              className="mt-6 px-6 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Return to Customer Storefront
            </Link>
          </div>
        ) : (
          children
        )}
      </AdminShell>
    </AdminThemeProvider>
  );
}
