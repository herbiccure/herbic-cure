'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { ArrowRight, Lock, Mail, User, Phone, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.error) {
        setError(res.error.message || 'Registration failed. Please try a different email.');
        setLoading(false);
        return;
      }

      toast.success('Account created successfully!');
      router.push('/account');
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
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">Create Your Account</h1>
          <p className="mt-2 text-sm text-stone-600">
            Join the Herbic Cure family for authentic Ayurvedic formulations and order tracking.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-rose-800">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>

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
                  placeholder="rahul@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Mobile Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Password (Min 10 characters)
              </label>
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
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${strength >= 1 ? 'bg-amber-400' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength >= 3 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength >= 4 ? 'bg-emerald-700' : 'bg-transparent'}`} />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {password.length < 10
                      ? 'Too short (10+ characters required)'
                      : strength >= 3
                      ? 'Strong passphrase'
                      : 'Moderate passphrase'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all cursor-pointer mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-stone-100 text-center">
          <p className="text-sm text-stone-600">
            Already have an account?{' '}
            <Link
              href="/account/login"
              className="font-bold text-emerald-800 hover:text-emerald-900 underline underline-offset-4"
            >
              Sign In
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-stone-500 pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Compliant with Indian DPDP Act 2023</span>
        </div>
      </div>
    </div>
  );
}
