'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { AdminGlobalStyles } from './AdminGlobalStyles';

export type AdminTheme = 'light';

interface AdminThemeContextType {
  theme: 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'light') => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useAdminTheme = () => useContext(AdminThemeContext);

export function AdminThemeProvider({
  children,
}: {
  children: React.ReactNode;
  initialTheme?: any;
}) {
  // Permanently strip dark mode class and force light theme
  useEffect(() => {
    try {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('herbic_admin_theme');
      document.cookie = 'herbic_admin_theme=light; path=/; max-age=31536000; SameSite=Lax';
    } catch {
      // ignore
    }
  }, []);

  return (
    <AdminThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {}, setTheme: () => {} }}>
      {/* Global Admin Light Mode Styles */}
      <AdminGlobalStyles />
      <div
        id="admin-theme-root"
        suppressHydrationWarning
        data-admin-theme="light"
        className="admin-theme-root min-h-screen admin-theme-light bg-[#FCF8F9] text-[#2D1B1B]"
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}
