'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Step state: 1 = Details, 2 = Mobile OTP Verification, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
  }>({});

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);

  // UI / Feedback State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // References to the 6 individual OTP input elements
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer effect for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Clean and format mobile number handling paste, spaces & country codes
  const handlePhoneChange = (val: string) => {
    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    setError(null);
    let digits = val.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    } else if (digits.length > 10) {
      digits = digits.slice(-10);
    }
    setPhone(digits);
  };

  // Quick fill helper for development/testing
  const handleQuickFill = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setName('Amit Kumar');
    setPhone('98' + randomNum + '1234');
    setEmail(`amit${randomNum}@example.com`);
    setPassword('Password123');
    setFieldErrors({});
    setError(null);
  };

  // STEP 1: Request OTP and move to verification
  const handleSendOtp = async () => {
    setError(null);
    setInfoMessage(null);

    // Sanitize phone
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    } else if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }

    const errors: typeof fieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Please enter your full name.';
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Mobile number must start with 6, 7, 8, or 9.';
    }

    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please fill all highlighted fields above to receive your OTP.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/customer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          email: email.trim(),
          name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to dispatch verification code.');
        setLoading(false);
        return;
      }

      setVerificationToken(data.verificationToken);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setResendTimer(60);
      setCanResend(false);
      setStep(2);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setInfoMessage(`Verification code generated for +91 ${cleanPhone}`);
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Network communication failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/customer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim(),
          name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend verification code.');
        setLoading(false);
        return;
      }

      setVerificationToken(data.verificationToken);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(60);
      setCanResend(false);
      setInfoMessage('New verification code sent successfully.');
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual OTP input box changes
  const handleOtpBoxChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (cleanVal.length > 1) {
      const newDigits = cleanVal.slice(0, 6).split('');
      const updated = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        updated[i] = newDigits[i] || '';
      }
      setOtpDigits(updated);
      const nextIndex = Math.min(cleanVal.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = cleanVal;
    setOtpDigits(updated);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation across OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Auto fill OTP in dev/preview mode
  const handleAutoFillDevOtp = () => {
    if (devOtp && devOtp.length === 6) {
      setOtpDigits(devOtp.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // STEP 2: Verify OTP and finalize registration
  const handleVerifyOtp = async () => {
    setError(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/customer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          otp: fullOtp,
          verificationToken,
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Verification failed. Please check the code.');
        setLoading(false);
        return;
      }

      setStep(3);

      // Authenticate session in client context
      login(data.customer);

      // Smooth redirection to dashboard
      setTimeout(() => {
        router.push('/account');
      }, 1500);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('Verification service unavailable. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xl space-y-6">
        {/* ========================================================= */}
        {/* STEP 1: INITIAL REGISTRATION FORM                         */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 bg-rose-50 text-[#A84358] border border-rose-200/80 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Customer Registration</span>
              </div>
              <h1 className="text-2xl font-extrabold text-stone-900 font-serif">
                Join Herbic Cure
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Enter your details to receive an authentic OTP verification code on your mobile
              </p>

              {/* Development Quick Fill helper */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 text-[11px] font-medium transition-colors cursor-pointer border border-stone-200"
                  title="Auto-fill sample valid inputs for rapid testing"
                >
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>⚡ Quick-Fill Test Data</span>
                </button>
              </div>
            </div>

            {/* Container using clean div to eliminate native browser form reloads */}
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    autoComplete="name"
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, name: undefined }));
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendOtp();
                    }}
                    placeholder="Your full name"
                    className={`w-full bg-stone-50/90 border rounded-xl px-4 py-2.5 pl-10 text-base sm:text-xs text-stone-900 outline-none transition-all touch-manipulation ${
                      fieldErrors.name
                        ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                        : 'border-stone-300 focus:border-[#A84358] focus:bg-white'
                    }`}
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 sm:top-3" />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Mobile Number with India Badge */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Mobile Number (OTP Verification)
                  </label>
                  <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                    SMS Verified
                  </span>
                </div>
                <div
                  className={`flex rounded-xl overflow-hidden border transition-all ${
                    fieldErrors.phone
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-stone-300 focus-within:border-[#A84358] focus-within:ring-1 focus-within:ring-[#A84358] bg-stone-50/90'
                  }`}
                >
                  <div className="flex items-center gap-1.5 px-3 bg-stone-100 border-r border-stone-200 text-xs font-bold text-stone-700 select-none">
                    <span>IN</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendOtp();
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full bg-transparent px-3 py-2.5 text-base sm:text-xs font-medium text-stone-900 outline-none touch-manipulation"
                  />
                </div>
                {fieldErrors.phone ? (
                  <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn">
                    {fieldErrors.phone}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-400 mt-1">
                    A 6-digit one-time code will be dispatched to this number.
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendOtp();
                    }}
                    placeholder="name@example.com"
                    className={`w-full bg-stone-50/90 border rounded-xl px-4 py-2.5 pl-10 text-base sm:text-xs text-stone-900 outline-none transition-all touch-manipulation ${
                      fieldErrors.email
                        ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                        : 'border-stone-300 focus:border-[#A84358] focus:bg-white'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 sm:top-3" />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendOtp();
                    }}
                    placeholder="Create password (min 6 characters)"
                    className={`w-full bg-stone-50/90 border rounded-xl px-4 py-2.5 pl-10 pr-10 text-base sm:text-xs text-stone-900 outline-none transition-all touch-manipulation ${
                      fieldErrors.password
                        ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                        : 'border-stone-300 focus:border-[#A84358] focus:bg-white'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 sm:top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer p-1 touch-manipulation"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 animate-fadeIn">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Global Error Alert Banner right above the action button */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 animate-fadeIn space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">{error}</span>
                  </div>
                  {error.includes('already registered') && (
                    <div className="pl-6 pt-1">
                      <Link
                        href="/account/login"
                        className="font-bold text-[#A84358] underline hover:text-rose-800"
                      >
                        Click here to Sign In →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#A84358] hover:bg-[#45363B] active:bg-[#092414] disabled:opacity-70 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer group touch-manipulation select-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Mobile OTP</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
              Already have an account?{' '}
              <Link href="/account/login" className="text-[#A84358] font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: MOBILE OTP VERIFICATION                           */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 bg-rose-50 text-[#A84358] border border-rose-200/80 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Step 2: Enter Verification Code</span>
              </div>
              <h1 className="text-2xl font-extrabold text-stone-900 font-serif">
                Verify Mobile Number
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Enter the 6-digit OTP sent to{' '}
                <span className="font-bold text-stone-800">+91 {phone}</span>
              </p>

              {/* Edit Phone Button */}
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A84358] hover:underline mt-2 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Change Mobile Number</span>
              </button>
            </div>

            {/* Dev / Test Mode Quick Auto-Fill Helper */}
            {devOtp && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-400/80 rounded-2xl flex items-center justify-between text-xs text-[#A84358] animate-fadeIn shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A84358] shrink-0" />
                  <div>
                    <span className="font-bold text-[11px] uppercase tracking-wide block text-rose-800">Test Verification Code:</span>
                    <span className="font-mono font-black tracking-widest text-base bg-white px-2.5 py-0.5 rounded-lg border border-rose-300 shadow-xs inline-block mt-0.5">
                      {devOtp}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillDevOtp}
                  className="px-3 py-2 bg-[#A84358] hover:bg-[#45363B] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer touch-manipulation"
                >
                  Auto-Fill OTP
                </button>
              </div>
            )}

            {infoMessage && !error && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-2 text-xs text-stone-700 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* 6 Discrete Pin Input Boxes */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={idx === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold text-[#A84358] bg-stone-50 border-2 border-stone-300 rounded-xl focus:border-[#A84358] focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none transition-all shadow-xs touch-manipulation"
                  />
                ))}
              </div>

              {/* Resend OTP Timer & Button */}
              <div className="text-center text-xs">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 font-bold text-[#A84358] hover:underline cursor-pointer touch-manipulation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend OTP Code</span>
                  </button>
                ) : (
                  <span className="text-stone-400">
                    Resend code in{' '}
                    <span className="font-bold text-stone-600 font-mono">
                      {resendTimer}s
                    </span>
                  </span>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3.5 rounded-xl bg-[#A84358] hover:bg-[#45363B] active:bg-[#092414] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer touch-manipulation select-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Create Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SUCCESS STATE                                     */}
        {/* ========================================================= */}
        {step === 3 && (
          <div className="text-center py-8 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-rose-100 text-[#A84358] rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 font-serif">
              Welcome to Herbic Cure!
            </h2>
            <p className="text-xs text-stone-600 max-w-xs mx-auto">
              Your mobile number has been successfully verified. Logging you into your customer portal...
            </p>
            <div className="pt-3">
              <Loader2 className="w-5 h-5 text-[#A84358] animate-spin mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
