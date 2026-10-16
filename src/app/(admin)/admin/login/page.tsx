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
  Sprout,
} from 'lucide-react';

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
      window.location.href = safeRedirect;
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-[#EAC9D1] bg-white p-6 sm:p-8 shadow-xl backdrop-blur-md transition-all duration-200 text-[#2D1B1B]">
        {/* Prominent HERBIC CURE Brand Identity matching Admin Console */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#8C3A4F] text-white flex items-center justify-center shadow-md">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-serif font-black text-xl tracking-wider text-[#2D1B1B] block leading-tight">
                HERBIC CURE
              </span>
              <span className="text-[11px] text-[#7A5B64] font-semibold tracking-tight block">
                Admin Console
              </span>
            </div>
          </div>
          <p className="text-xs text-[#7A5B64] mt-1">
            Internal Operations & Store Management
          </p>
        </div>

        {/* Security Alert Badge */}
        <div className="flex items-center gap-2 p-3 rounded-2xl text-xs mb-6 bg-[#FDF0F4] text-[#8C3A4F] border border-[#EAC9D1]">
          <KeyRound className="w-4 h-4 shrink-0 text-[#8C3A4F]" />
          <span className="text-[11px] font-medium leading-relaxed">
            Restricted Access. Authorized personnel only.
          </span>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#45363B]">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@herbiccure.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[#EAC9D1] bg-[#FCF8F9] text-[#2D1B1B] placeholder:text-[#A38D95] transition-all outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
              />
              <Mail className="w-4 h-4 text-[#A38D95] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#45363B]">
              Security Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#EAC9D1] bg-[#FCF8F9] text-[#2D1B1B] placeholder:text-[#A38D95] transition-all outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
              />
              <Lock className="w-4 h-4 text-[#A38D95] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A38D95] hover:text-[#2D1B1B] p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#8C3A4F] hover:bg-[#722E3F] active:scale-[0.99] transition-all shadow-md hover:shadow-[#8C3A4F]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
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
          className="inline-flex items-center gap-1.5 text-xs text-[#7A5B64] hover:text-[#8C3A4F] transition-colors"
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
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-[#FCF8F9] text-[#2D1B1B] relative">
      {/* Top Bar with brand */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#8C3A4F] text-white flex items-center justify-center shadow-md group-hover:bg-[#722E3F] transition-colors">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <div className="font-serif font-black text-sm tracking-wide text-[#2D1B1B]">
              HERBIC CURE
            </div>
            <p className="text-[10px] text-[#7A5B64] font-medium tracking-tight">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Main Login Card with Suspense for useSearchParams */}
      <div className="flex-1 flex items-center justify-center py-6">
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-[#7A5B64] flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-[#8C3A4F]" />
              <span>Loading login portal...</span>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Bottom Footer */}
      <div className="w-full text-center py-4 text-[11px] text-[#A38D95]">
        Herbic Cure Ecommerce Admin CMS • Encrypted Internal Access
      </div>
    </div>
  );
}
