'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Package,
  Boxes,
  FolderTree,
  Layers,
  Sparkles,
  Users,
  Star,
  Camera,
  Tag,
  BookOpen,
  Share2,
  LayoutGrid,
  Image as ImageIcon,
  MessageSquare,
  Mail,
  Megaphone,
  Settings,
  Menu,
  X,
  ExternalLink,
  LogOut,
  ShieldCheck,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { AdminThemeToggle } from './AdminThemeToggle';
import { useAdminTheme } from './AdminThemeProvider';
import { Toaster } from 'sonner';

interface AdminShellProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Intelligence & Growth',
    items: [
      { label: 'Executive Analytics', href: '/admin/analytics', icon: TrendingUp },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Products & Deals', href: '/admin/products', icon: Package },
      { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Collections', href: '/admin/collections', icon: Layers },
      { label: 'Ingredients', href: '/admin/ingredients', icon: Sparkles },
    ],
  },
  {
    title: 'Customers & Growth',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Coupons', href: '/admin/coupons', icon: Tag },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
      { label: 'Results & UGC', href: '/admin/customer-results', icon: Camera },
    ],
  },
  {
    title: 'Content & Media',
    items: [
      { label: 'How to Use & Blog', href: '/admin/blog', icon: BookOpen },
      { label: 'Social Content', href: '/admin/social-content', icon: Share2 },
      { label: 'Homepage CMS', href: '/admin/homepage', icon: LayoutGrid },
      { label: 'Media Library', href: '/admin/media', icon: ImageIcon },
      { label: 'Contact Inquiries', href: '/admin/contact-submissions', icon: MessageSquare },
      { label: 'Announcement Bar', href: '/admin/announcements', icon: Megaphone },
      { label: 'Legal Policies', href: '/admin/policies', icon: FileText },
      { label: 'Subscribers', href: '/admin/subscribers', icon: Mail },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Store Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Allow login page to render cleanly without the admin sidebar/header shell
  if (pathname === '/admin/login') {
    return <main className="min-h-screen">{children}</main>;
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error', e);
      router.push('/admin/login');
    } finally {
      setLoggingOut(false);
    }
  };

  // Find current active item title for breadcrumb
  let activeTitle = 'Admin Console';
  for (const sec of NAV_SECTIONS) {
    const found = sec.items.find(
      (it) => pathname === it.href || (it.href !== '/admin' && pathname.startsWith(it.href))
    );
    if (found) {
      activeTitle = found.label;
      break;
    }
  }

  const renderNavList = () => (
    <div className="space-y-6 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="px-3">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? isLight
                        ? 'admin-sidebar-nav-active bg-rose-50 text-rose-950 font-bold shadow-xs border-l-4 border-rose-600 pl-2'
                        : 'bg-rose-950/60 text-rose-300 font-bold shadow-xs border-l-4 border-rose-500 pl-2'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? isLight
                          ? 'text-rose-700'
                          : 'text-rose-400'
                        : isLight
                        ? 'text-slate-500 group-hover:text-slate-800'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span className={`truncate ${isActive && isLight ? 'text-rose-950 font-bold' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row admin-shell-container">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-40 border-r transition-colors duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 px-5 flex items-center justify-between border-b ${
            isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/90'
          }`}
        >
          <Link href="/admin/orders" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-rose-700 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-rose-800 transition-colors">
              🌿
            </div>
            <div>
              <span className="font-serif font-black tracking-wide text-sm block leading-none">
                HERBIC CURE
              </span>
              <span className={`text-[10px] font-semibold tracking-wider uppercase ${
                isLight ? 'text-rose-700' : 'text-rose-400'
              }`}>
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {renderNavList()}
        </div>

        {/* Sidebar Footer User / Logout */}
        <div
          className={`p-3 border-t space-y-2 ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isLight
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-rose-700/20 text-rose-400'
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Admin User</p>
                <p className="text-[10px] text-slate-500 truncate">SUPER_ADMIN</p>
              </div>
            </div>
            <AdminThemeToggle variant="compact" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-200/70 text-slate-700'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
              title="Open customer storefront in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Store</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                isLight
                  ? 'border-red-200 hover:bg-red-50 text-red-600'
                  : 'border-red-900/50 hover:bg-red-950/40 text-red-400'
              }`}
              title="Sign out of admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Exiting...' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`relative flex flex-col w-72 max-w-xs h-full border-r z-10 shadow-2xl transition-all ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            <div
              className={`h-16 px-4 flex items-center justify-between border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <span className="font-serif font-black text-sm">HERBIC CURE</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/30 text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNavList()}</div>
            <div className="p-4 border-t border-slate-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Appearance</span>
                <AdminThemeToggle variant="segmented" />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header
          className={`sticky top-0 z-30 h-16 border-b backdrop-blur-md transition-colors duration-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
              : 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-sm'
          }`}
        >
          {/* Mobile hamburger + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 rounded-xl border md:hidden cursor-pointer ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-200'
              }`}
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Admin</span>
                <span>/</span>
                <span className={`font-semibold truncate ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                  {activeTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions: Theme toggle, Store preview, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <AdminThemeToggle variant="segmented" />

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Store</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLight
                  ? 'border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600'
                  : 'border-slate-800 hover:bg-red-950/40 hover:border-red-900/50 text-slate-400 hover:text-red-400'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? '...' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        {/* Main View Wrapper with Consistent Padding & Margins */}
        <Toaster richColors position="top-right" theme={theme === 'light' ? 'light' : 'dark'} closeButton />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
