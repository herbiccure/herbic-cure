'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminGlobalStyles } from './AdminGlobalStyles';

export type AdminTheme = 'light' | 'dark';

interface AdminThemeContextType {
  theme: AdminTheme;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useAdminTheme = () => useContext(AdminThemeContext);

export function AdminThemeProvider({
  children,
  initialTheme = 'light',
}: {
  children: React.ReactNode;
  initialTheme?: AdminTheme;
}) {
  const [theme, setThemeState] = useState<AdminTheme>(initialTheme);

  // Sync html classList and storage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('herbic_admin_theme') as AdminTheme | null;
      const effective = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : initialTheme;
      setThemeState(effective);
      document.documentElement.classList.toggle('dark', effective === 'dark');
      document.cookie = `herbic_admin_theme=${effective}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Fallback
    }
  }, [initialTheme]);

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('herbic_admin_theme', newTheme);
      document.cookie = `herbic_admin_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {/* Global Admin Light Mode Dynamic Overrides */}
      <AdminGlobalStyles />
      {/* Synchronous anti-FOUC script ensuring the DOM matches stored preference before paint */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var m=document.cookie.match(/herbic_admin_theme=([^;]+)/);var t=(m&&m[1])||localStorage.getItem('herbic_admin_theme')||'${initialTheme}';var r=document.getElementById('admin-theme-root');if(r){r.setAttribute('data-admin-theme',t);r.className=r.className.replace(/admin-theme-(light|dark)/,'admin-theme-'+t);if(t==='dark'){r.classList.add('dark');document.documentElement.classList.add('dark');}else{r.classList.remove('dark');document.documentElement.classList.remove('dark');}}}catch(e){}})();`,
        }}
      />
      <div
        id="admin-theme-root"
        data-admin-theme={theme}
        className={`admin-theme-root min-h-screen ${
          theme === 'dark' ? 'admin-theme-dark dark' : 'admin-theme-light'
        }`}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}
