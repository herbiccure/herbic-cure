'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }

      login(data.customer);
      router.push('/account');
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection failed. Please check your network and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xl space-y-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-3 inline-block">
            Member Access
          </span>
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">
            Welcome to Herbic Cure
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Sign in with your Email or verified Mobile Number
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
          }}
          action="javascript:void(0);"
          noValidate
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Email or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="your@email.com or 10-digit mobile"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:border-[#A84358] outline-none"
              />
              <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:border-[#A84358] outline-none"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#A84358] hover:bg-[#45363B] disabled:opacity-70 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-stone-500">
          Don&apos;t have an account?{' '}
          <Link href="/account/register" className="text-[#A84358] font-bold hover:underline">
            Register with Mobile OTP
          </Link>
        </div>
      </div>
    </div>
  );
}
