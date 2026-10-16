'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard,
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
  MessageSquare,
  Mail,
  Megaphone,
  Percent,
  RotateCcw,
  ShieldCheck,
  FileText,
  Settings,
  HelpCircle,
  ExternalLink,
  LogOut,
  ChevronRight,
  Menu,
  X,
  TrendingUp, Sprout } from 'lucide-react';
import { useAdminTheme } from './AdminThemeProvider';

export interface AdminShellProps {
  children: React.ReactNode;
  userRole?: string;
  isAuthenticated?: boolean;
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
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Homepage CMS', href: '/admin/homepage', icon: LayoutGrid },
    ],
  },
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
      { label: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
    ],
  },
  {
    title: 'Storefront CMS',
    items: [
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Collections', href: '/admin/collections', icon: Layers },
    ],
  },
  {
    title: 'Customer Experience',
    items: [
      { label: 'Customer Base', href: '/admin/customers', icon: Users },
      { label: 'Reviews & UGC', href: '/admin/reviews', icon: Star },
      { label: 'Hair Results', href: '/admin/customer-results', icon: Camera },
      { label: 'Inquiries', href: '/admin/contact-submissions', icon: MessageSquare },
      { label: 'FAQ Database', href: '/admin/faqs', icon: HelpCircle },
    ],
  },
  {
    title: 'Marketing & Retention',
    items: [
      { label: 'Discounts & Coupons', href: '/admin/coupons', icon: Percent },
      { label: 'Banner & Deals', href: '/admin/announcements', icon: Megaphone },
      { label: 'Ayurvedic Blog', href: '/admin/blog', icon: BookOpen },
      { label: 'Social Content', href: '/admin/social-content', icon: Share2 },
      { label: 'Legal Policies', href: '/admin/policies', icon: FileText },
      { label: 'Subscribers', href: '/admin/subscribers', icon: Mail },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Staff & Roles', href: '/admin/staff', icon: ShieldCheck },
      { label: 'Audit Trail', href: '/admin/audit', icon: FileText },
      { label: 'Store Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminShell({ children, userRole, isAuthenticated = true }: AdminShellProps) {
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

  // If unauthenticated on a protected admin page, show loading state while redirecting
  useEffect(() => {
    if (!isAuthenticated && pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
  }, [isAuthenticated, pathname]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FCF8F9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#8C3A4F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#7A5B64]">Redirecting to admin sign in...</p>
        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (e) {
      console.error('Logout error', e);
      window.location.href = '/admin/login';
    }
  };

  // Find current active item title for breadcrumb
  let activeTitle = 'Dashboard';
  if (pathname === '/admin') {
    activeTitle = 'Dashboard';
  } else {
    for (const sec of NAV_SECTIONS) {
      const found = sec.items.find(
        (it) => it.href !== '/admin' && (pathname === it.href || pathname.startsWith(it.href + '/'))
      );
      if (found) {
        activeTitle = found.label;
        break;
      }
    }
  }

  const renderNavList = () => (
    <nav className="p-3 space-y-6">
      {NAV_SECTIONS.map((section, sIdx) => (
        <div key={sIdx} className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#8C3A4F] text-white shadow-xs font-bold'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#FCF8F9] text-[#2D1B1B] admin-shell-container flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-40 bg-white border-r border-[#EAC9D1] admin-sidebar-desktop"
      >
        {/* Brand Header */}
        <div
          className={`h-16 px-6 flex items-center justify-between border-b transition-colors duration-200 ${
            isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/90'
          }`}
        >
          <Link href="/admin" className="flex items-center gap-2.5 group" title="Admin Dashboard Overview">
            <div className="w-8 h-8 rounded-xl bg-rose-700 text-white flex items-center justify-center shadow-md group-hover:bg-rose-800 transition-colors"><Sprout className="w-4 h-4" /></div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="font-serif font-black text-sm tracking-wide"
                  style={{ color: isLight ? '#2D1B1B' : '#FFFFFF' }}
                >
                  HERBIC CURE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Admin Console</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">{renderNavList()}</div>

        {/* User Footer Profile & Actions */}
        <div
          className={`p-4 border-t space-y-2.5 transition-colors duration-200 ${
            isLight ? 'border-slate-200 bg-slate-50/60' : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
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
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 group">
                <div className="w-6 h-6 rounded-md bg-rose-700 text-white flex items-center justify-center"><Sprout className="w-3.5 h-3.5" /></div>
                <span
                  className="font-serif font-black text-sm"
                  style={{ color: isLight ? '#2D1B1B' : '#FFFFFF' }}
                >
                  HERBIC CURE
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">ADMIN</span>
              </Link>
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
      <div className="admin-main-wrapper flex-1 flex flex-col min-w-0 min-h-screen md:ml-64 bg-[#FCF8F9]">
        {/* Top Navbar */}
        <header
          className="sticky top-0 z-30 h-16 border-b border-[#EAC9D1] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-2xs"
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
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Link
                  href="/admin"
                  className="font-medium hover:text-[#8C3A4F] dark:hover:text-rose-300 transition-colors flex items-center gap-1"
                  title="Return to Admin Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#8C3A4F] dark:text-rose-400" />
                  <span>Admin</span>
                </Link>
                <span className="text-slate-400 dark:text-slate-600">/</span>
                <span className={`font-bold truncate ${isLight ? 'text-[#8C3A4F]' : 'text-rose-400'}`}>
                  {activeTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions: Store preview & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
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
        <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-8 flex flex-col justify-start">
          {children}
        </main>
      </div>
    </div>
  );
}
