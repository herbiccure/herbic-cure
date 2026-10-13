'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { ArrowRight, Lock, Mail, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        setError(res.error.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      toast.success('Signed in successfully!');
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/80 shadow-xl shadow-stone-200/50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mb-4 shadow-sm">
            <Sparkles className="w-6 h-6 text-emerald-700" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">Welcome Back</h1>
          <p className="mt-2 text-sm text-stone-600">
            Sign in to access your Ayurvedic orders, consultations, and saved addresses.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-rose-800">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Password
                </label>
                <Link
                  href="/track-order"
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  Track guest order?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-stone-100 text-center">
          <p className="text-sm text-stone-600">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/account/register"
              className="font-bold text-emerald-800 hover:text-emerald-900 underline underline-offset-4"
            >
              Create Account
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-stone-500 pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Protected with Argon2id cryptographic encryption</span>
        </div>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
