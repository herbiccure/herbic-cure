import React from 'react';
import { cookies } from 'next/headers';
import { AdminThemeProvider, AdminTheme } from '@/components/admin/AdminThemeProvider';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Herbic Cure Admin Console',
  robots: 'noindex, nofollow',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('herbic_admin_theme')?.value as AdminTheme | undefined;
  // Default to light mode (or user's saved preference in cookie)
  const initialTheme: AdminTheme = themeCookie === 'dark' ? 'dark' : 'light';

  return (
    <AdminThemeProvider initialTheme={initialTheme}>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
