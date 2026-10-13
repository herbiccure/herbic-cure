'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  Loader2,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFrom = searchParams.get('from');

  // Strict Open-Redirect Protection: allow only relative internal routes
  let safeRedirect = '/admin';
  if (
    rawFrom &&
    rawFrom.startsWith('/') &&
    !rawFrom.startsWith('//') &&
    !rawFrom.includes('\\') &&
    !rawFrom.includes(':')
  ) {
    safeRedirect = rawFrom;
  }

  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid administrator credentials');
      }

      // Success - Redirect only to verified safe internal path
      router.push(safeRedirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top Header Card */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-2xl backdrop-blur-md transition-all duration-200 ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-black/60'
        }`}
      >
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-700 text-white text-2xl shadow-lg mb-3">
            🌿
          </div>
          <h1 className="text-2xl font-bold font-serif tracking-tight">
            Herbic Cure Admin
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Internal Operations & Store Management Console
          </p>
        </div>

        {/* Security Alert Badge */}
        <div
          className={`flex items-center gap-2 p-3 rounded-2xl text-xs mb-6 ${
            isLight
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-rose-950/50 text-rose-300 border border-rose-900/60'
          }`}
        >
          <KeyRound className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="text-[11px] font-medium leading-relaxed">
            Restricted Access. Authorized personnel only.
          </span>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@herbiccure.com"
                className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border transition-all outline-hidden focus:ring-2 focus:ring-rose-500/40 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                    : 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800'
                }`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
              Security Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border transition-all outline-hidden focus:ring-2 focus:ring-rose-500/40 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                    : 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-rose-700 hover:bg-rose-800 active:scale-[0.99] transition-all shadow-md hover:shadow-rose-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Back to Live Store */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Customer Storefront</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Top Bar with theme toggle */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="font-serif font-black text-sm tracking-wide">HERBIC CURE</span>
        </Link>
        <AdminThemeToggle variant="segmented" />
      </div>

      {/* Main Login Card with Suspense for useSearchParams */}
      <div className="flex-1 flex items-center justify-center py-6">
        <Suspense fallback={
          <div className="p-8 text-center text-xs text-slate-400 flex items-center gap-2 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading login portal...</span>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>

      {/* Bottom Footer */}
      <div className="w-full text-center py-4 text-[11px] text-slate-400 dark:text-slate-500">
        Herbic Cure Ecommerce Admin CMS • Encrypted Internal Access
      </div>
    </div>
  );
}
