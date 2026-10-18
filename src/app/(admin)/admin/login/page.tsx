'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  Sprout,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Key,
  RefreshCw,
} from 'lucide-react';

function LoginForm() {
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

  // Active view: 'signin' | 'changepassword'
  const [view, setView] = useState<'signin' | 'changepassword'>('signin');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Change Password State
  const [changeEmail, setChangeEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    setChangeSuccess(null);

    if (newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New password and confirm password do not match.');
      return;
    }

    setChangeLoading(true);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: changeEmail.trim() || email.trim(),
          currentPassword,
          newPassword,
          confirmPassword,
          recoveryKey: recoveryKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setChangeSuccess('Password changed successfully! You can now sign in.');
      // Pre-fill sign-in email and switch to sign in view after a short delay
      setEmail(changeEmail.trim() || email.trim());
      setPassword('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setRecoveryKey('');

      setTimeout(() => {
        setView('signin');
        setChangeSuccess(null);
      }, 2500);
    } catch (err: any) {
      setChangeError(err.message || 'Error updating password.');
    } finally {
      setChangeLoading(false);
    }
  };

  const switchToChangePassword = () => {
    setChangeEmail(email);
    setError(null);
    setChangeError(null);
    setChangeSuccess(null);
    setView('changepassword');
  };

  const switchToSignIn = () => {
    setError(null);
    setChangeError(null);
    setView('signin');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-[#EAC9D1] bg-white p-6 sm:p-8 shadow-xl backdrop-blur-md transition-all duration-200 text-[#2D1B1B]">
        {/* Prominent Brand Identity */}
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
            {view === 'signin'
              ? 'Internal Operations & Store Management'
              : 'Security Credential Update Portal'}
          </p>
        </div>

        {/* Tab Selector: Sign In vs Change Password */}
        <div className="flex bg-[#FCF8F9] p-1 rounded-2xl border border-[#EAC9D1] mb-5">
          <button
            type="button"
            onClick={switchToSignIn}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              view === 'signin'
                ? 'bg-[#8C3A4F] text-white shadow-xs'
                : 'text-[#7A5B64] hover:text-[#2D1B1B]'
            }`}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={switchToChangePassword}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              view === 'changepassword'
                ? 'bg-[#8C3A4F] text-white shadow-xs'
                : 'text-[#7A5B64] hover:text-[#2D1B1B]'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* ================= VIEW 1: SIGN IN FORM ================= */}
        {view === 'signin' && (
          <div>
            {/* Security Alert Badge */}
            <div className="flex items-center gap-2 p-3 rounded-2xl text-xs mb-5 bg-[#FDF0F4] text-[#8C3A4F] border border-[#EAC9D1]">
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

            <form onSubmit={handleSignIn} className="space-y-4">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#45363B]">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={switchToChangePassword}
                    className="text-[11px] font-semibold text-[#8C3A4F] hover:underline cursor-pointer"
                  >
                    Change Password?
                  </button>
                </div>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A38D95] hover:text-[#2D1B1B] p-1 cursor-pointer"
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
        )}

        {/* ================= VIEW 2: CHANGE PASSWORD FORM ================= */}
        {view === 'changepassword' && (
          <div>
            {/* Success Banner */}
            {changeSuccess && (
              <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{changeSuccess}</span>
              </div>
            )}

            {/* Error Banner */}
            {changeError && (
              <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="font-medium">{changeError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#45363B]">
                  Admin Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={changeEmail || email}
                    onChange={(e) => setChangeEmail(e.target.value)}
                    placeholder="admin@herbiccure.com"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#EAC9D1] bg-[#FCF8F9] text-[#2D1B1B] outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                  />
                  <Mail className="w-3.5 h-3.5 text-[#A38D95] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {!showRecoveryInput && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#45363B]">
                      Current Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRecoveryInput(true)}
                      className="text-[10px] text-[#8C3A4F] hover:underline cursor-pointer"
                    >
                      Forgot Current?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required={!showRecoveryInput}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password"
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-[#EAC9D1] bg-[#FCF8F9] text-[#2D1B1B] outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#A38D95] absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A38D95] hover:text-[#2D1B1B] p-1 cursor-pointer"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {showRecoveryInput && (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      Master Secret / Recovery Key
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecoveryInput(false);
                        setRecoveryKey('');
                      }}
                      className="text-[10px] text-amber-800 underline cursor-pointer"
                    >
                      Use Password Instead
                    </button>
                  </div>
                  <input
                    type="password"
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="Enter SESSION_SECRET or master key"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-amber-200 bg-white text-stone-900 outline-hidden font-mono"
                  />
                  <p className="text-[10px] text-amber-800/80">
                    Allows instant password reset using the server secret key configured in .env.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 text-[#45363B]">
                  New Security Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-[#EAC9D1] bg-[#FCF8F9] text-[#2D1B1B] outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-[#A38D95] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A38D95] hover:text-[#2D1B1B] p-1 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[#45363B]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-[#EAC9D1] bg-[#FCF8F9] text-[#2D1B1B] outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#A38D95] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A38D95] hover:text-[#2D1B1B] p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={changeLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#8C3A4F] hover:bg-[#722E3F] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {changeLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Security Password...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Update Security Password</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={switchToSignIn}
                  className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-[#7A5B64] hover:text-[#2D1B1B] hover:bg-stone-50 transition-all cursor-pointer text-center"
                >
                  Cancel &amp; Return to Sign In
                </button>
              </div>
            </form>
          </div>
        )}
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
