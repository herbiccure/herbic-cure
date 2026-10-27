'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Save,
  ShieldCheck,
  Truck,
  Store,
  Megaphone,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';

const DEFAULT_LOGO_URL = '/images/banners/herbic-cure-logo.png';

export default function AdminSettingsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [storeName, setStoreName] = useState('Herbic Cure');
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const [footerLogoUrl, setFooterLogoUrl] = useState(DEFAULT_LOGO_URL);
  const [supportEmail, setSupportEmail] = useState('care@herbiccure.com');
  const [supportPhone, setSupportPhone] = useState('+91 8121961219');
  const [codEnabled, setCodEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(499);
  const [standardShippingFee, setStandardShippingFee] = useState(89);
  
  // COD Advance Payment Settings
  const [codAdvanceEnabled, setCodAdvanceEnabled] = useState(false);
  const [codAdvanceType, setCodAdvanceType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [codAdvanceValue, setCodAdvanceValue] = useState<number | string>(99);
  const [codAdvanceMaxCap, setCodAdvanceMaxCap] = useState<number | string>('');
  const [codAdvanceMessage, setCodAdvanceMessage] = useState(
    'Pay a small advance online to confirm your COD order. The rest is paid on delivery.'
  );
  const [shippingMode, setShippingMode] = useState<'delhivery_pending' | 'auto_manifest'>('auto_manifest');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingFooterLogo, setUploadingFooterLogo] = useState(false);
  const [uploadFooterError, setUploadFooterError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  // Security & Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    try {
      setPwSaving(true);
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      setPwMessage({ type: 'success', text: 'Security password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMessage({ type: 'error', text: err.message || 'Error updating password' });
    } finally {
      setPwSaving(false);
    }
  };

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          if (s.brand_name) setStoreName(s.brand_name);
          if (s.store_logo || s.logo_url) setLogoUrl(s.store_logo || s.logo_url);
          if (s.footer_logo) setFooterLogoUrl(s.footer_logo);
          if (s.contact_email) setSupportEmail(s.contact_email);
          if (s.contact_phone) setSupportPhone(s.contact_phone);
          if (s.cod_available !== undefined) setCodEnabled(s.cod_available === 'true');
          if (s.free_shipping_threshold) setFreeShippingThreshold(Number(s.free_shipping_threshold));
          if (s.standard_shipping_fee) setStandardShippingFee(Number(s.standard_shipping_fee));
          if (s.cod_advance_enabled !== undefined) setCodAdvanceEnabled(s.cod_advance_enabled === 'true');
          if (s.cod_advance_type) setCodAdvanceType(s.cod_advance_type as 'FIXED' | 'PERCENTAGE');
          if (s.cod_advance_value !== undefined) setCodAdvanceValue(s.cod_advance_value);
          if (s.cod_advance_max_cap !== undefined) setCodAdvanceMaxCap(s.cod_advance_max_cap);
          if (s.cod_advance_message) setCodAdvanceMessage(s.cod_advance_message);
          if (s.shipping_mode) setShippingMode(s.shipping_mode as 'delhivery_pending' | 'auto_manifest');
        }
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setLogoUrl(data.url);
      setSaved(false);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading image');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetLogo = () => {
    setLogoUrl(DEFAULT_LOGO_URL);
    setUploadError(null);
  };

  const handleFooterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFooterLogo(true);
    setUploadFooterError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload footer logo');
      }

      setFooterLogoUrl(data.url);
      setSaved(false);
    } catch (err: any) {
      setUploadFooterError(err.message || 'Error uploading footer logo');
    } finally {
      setUploadingFooterLogo(false);
      if (footerFileInputRef.current) {
        footerFileInputRef.current.value = '';
      }
    }
  };

  const handleResetFooterLogo = () => {
    setFooterLogoUrl(DEFAULT_LOGO_URL);
    setUploadFooterError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveErrorMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: storeName,
          store_logo: logoUrl,
          logo_url: logoUrl,
          footer_logo: footerLogoUrl,
          contact_email: supportEmail,
          contact_phone: supportPhone,
          cod_available: codEnabled ? 'true' : 'false',
          free_shipping_threshold: String(freeShippingThreshold),
          standard_shipping_fee: String(standardShippingFee),
          cod_advance_enabled: codAdvanceEnabled ? 'true' : 'false',
          cod_advance_type: codAdvanceType,
          cod_advance_value: String(codAdvanceValue),
          cod_advance_max_cap: codAdvanceMaxCap ? String(codAdvanceMaxCap) : '',
          cod_advance_message: codAdvanceMessage,
          shipping_mode: shippingMode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      } else {
        setSaveErrorMessage(data.error || 'Failed to update store settings');
      }
    } catch (err: any) {
      setSaveErrorMessage(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold font-serif ${isLight ? 'text-stone-900' : 'text-white'}`}>
            Store Settings &amp; Branding
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-stone-500' : 'text-slate-400'}`}>
            Configure your store logo, visual brand identity, header appearance, shipping rules, and contact info.
          </p>
        </div>

        {saved && (
          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1.5 shadow-sm">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Settings &amp; Logo updated successfully!</span>
          </div>
        )}
      </div>

      {/* Quick Access to Announcement Bar and Legal Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Announcement Bar */}
        <div
          className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 shadow-xs ${
            isLight
              ? 'bg-gradient-to-r from-rose-50 to-stone-50 border-rose-200/80'
              : 'bg-gradient-to-r from-rose-950/30 to-slate-900 border-rose-900/50'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Announcement Bar Ticker
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-stone-600' : 'text-slate-300'}`}>
                Edit the live marquee ticker, scroll speed, and luxury color themes.
              </p>
            </div>
          </div>

          <Link
            href="/admin/announcements"
            className="px-4 py-2 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold flex items-center justify-between transition-all shadow-md"
          >
            <span>Open Announcement Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Legal Policies & Disclaimers */}
        <div
          className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 shadow-xs ${
            isLight
              ? 'bg-gradient-to-r from-blue-50 to-stone-50 border-blue-200/80'
              : 'bg-gradient-to-r from-blue-950/30 to-slate-900 border-blue-900/50'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Legal Policies &amp; Disclaimers
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-stone-600' : 'text-slate-300'}`}>
                Edit Terms of Service, Privacy Policy, Refunds, and Shipping terms.
              </p>
            </div>
          </div>

          <Link
            href="/admin/policies"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-between transition-all shadow-md"
          >
            <span>Open Policy Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* 1. HEADER LOGO & NAVBAR BRANDING (FULL WIDTH)                              */}
        {/* ========================================================================= */}
        <div
          className={`lg:col-span-2 rounded-3xl border p-6 shadow-sm space-y-6 ${
            isLight ? 'bg-white border-stone-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/60 ">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#A84358]/10 text-[#A84358] flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  1. Header Logo &amp; Navbar Branding
                </h2>
                <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-slate-400'}`}>
                  This logo displays on the main website header, sticky scrolled bar, and mobile drawer. Changing this will <strong>NOT</strong> affect your footer logo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600  border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Header Active
              </span>
            </div>
          </div>

          {/* Interactive Simulation: How it looks right on the header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-stone-600' : 'text-slate-300'}`}>
                <Eye className="w-3.5 h-3.5 text-rose-500" />
                Live Storefront Header Simulation
              </span>
              <span className="text-[11px] text-stone-400">
                Real-time preview
              </span>
            </div>

            {/* Mock Header Banner matching the user's header */}
            <div className="rounded-2xl border border-stone-200/90  bg-[#FFFFFF] shadow-sm overflow-hidden p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Simulated Left Search bar */}
              <div className="w-full md:w-72 bg-stone-100 rounded-full px-4 py-2 flex items-center gap-2 text-stone-400 text-xs shrink-0 select-none">
                <Search className="w-3.5 h-3.5 text-stone-400" />
                <span className="truncate">Search hair oils, combos, 21 herbs...</span>
              </div>

              {/* Simulated Centered Logo (exact match to header) */}
              <div className="relative h-14 sm:h-16 w-44 sm:w-56 flex items-center justify-center p-1 bg-stone-50/50 rounded-xl border border-dashed border-stone-200/80">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={storeName}
                    width={220}
                    height={60}
                    className="object-contain max-h-14 sm:max-h-16"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs text-stone-400 italic">No header logo selected</span>
                )}
              </div>

              {/* Simulated Right utilities */}
              <div className="hidden sm:flex items-center gap-3 shrink-0 select-none">
                <span className="text-xs font-medium text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                  Ayurvedic Specialist
                </span>
                <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-full">
                  Bag (0)
                </span>
              </div>
            </div>
          </div>

          {/* Logo Canvas Preview */}
          <div className="p-4 rounded-2xl bg-[#FBF5F6] border border-[#EAC9D1] flex flex-col items-center justify-center text-center gap-2">
            <span className="text-[11px] font-bold text-[#7A5B64] uppercase tracking-wider">
              Header Logo Canvas Preview
            </span>
            <div className="relative h-16 w-56 flex items-center justify-center bg-white rounded-xl p-2 border border-[#EAC9D1] shadow-2xs">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Storefront Header Logo Preview"
                  width={180}
                  height={50}
                  className="object-contain max-h-14"
                  unoptimized
                />
              ) : (
                <span className="text-xs text-stone-400 italic">No logo selected</span>
              )}
            </div>
          </div>

          {/* Controls: Upload & URL */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* File Upload Button */}
              <div className="sm:col-span-5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  id="logo-file-input"
                />
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    uploadingLogo
                      ? 'opacity-60 cursor-not-allowed bg-stone-100 border-stone-300 text-stone-600'
                      : isLight
                      ? 'bg-rose-50 border-rose-200 text-[#A84358] hover:bg-rose-100 hover:border-rose-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/60'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingLogo ? 'Uploading Header Logo...' : 'Upload Header Logo From Device'}</span>
                </button>
              </div>

              {/* Reset Button */}
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default</span>
                </button>
              </div>

              <div className="sm:col-span-4 text-right">
                <span className="text-[11px] text-stone-400">
                  Recommended: Transparent PNG or SVG (250x70px)
                </span>
              </div>
            </div>

            {/* Direct Image URL input */}
            <div>
              <label className={`block font-semibold mb-1 text-xs ${isLight ? 'text-stone-600' : 'text-slate-400'}`}>
                Or Enter Header Logo URL / Asset Path:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="/images/banners/herbic-cure-logo.png or https://..."
                  className={`w-full rounded-xl px-3.5 py-2 text-xs border outline-none font-mono ${
                    isLight
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                  }`}
                />
              </div>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FOOTER LOGO & BRAND IDENTITY (SEPARATE FULL WIDTH)                      */}
        {/* ========================================================================= */}
        <div
          className={`lg:col-span-2 rounded-3xl border p-6 shadow-sm space-y-6 ${
            isLight ? 'bg-white border-stone-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/60 ">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#8C3A4F]/10 text-[#8C3A4F] flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  2. Footer Brand Logo (Bottom Website Footer)
                </h2>
                <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-slate-400'}`}>
                  This logo displays specifically in the website footer brand column. Changing this will <strong>NOT</strong> affect your header logo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600  border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Footer Active
              </span>
              <Link
                href="/admin/footer"
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
              >
                <span>Footer CMS Studio</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Interactive Simulation: How it looks in the real footer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-stone-600' : 'text-slate-300'}`}>
                <Eye className="w-3.5 h-3.5 text-[#8C3A4F]" />
                Live Storefront Footer Simulation
              </span>
              <span className="text-[11px] text-stone-400">
                Real-time footer canvas
              </span>
            </div>

            {/* Mock Footer Brand Box matching real footer background #F6DFE7 */}
            <div className="rounded-2xl border border-[#EAC9D1] bg-[#F6DFE7] shadow-sm overflow-hidden p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-[#2D1B1B]">
              <div className="space-y-3 max-w-md">
                <div className="relative h-14 sm:h-16 w-44 sm:w-52 flex items-center justify-center p-1 bg-white/70 backdrop-blur-xs rounded-xl border border-[#EAC9D1]">
                  {footerLogoUrl ? (
                    <Image
                      src={footerLogoUrl}
                      alt="Footer Brand Logo"
                      width={200}
                      height={56}
                      className="object-contain max-h-14 sm:max-h-16"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs text-stone-400 italic">No footer logo selected</span>
                  )}
                </div>
                <p className="text-xs text-[#543E44] font-medium leading-relaxed">
                  Inspired by Himalayan Herbs • Handcrafted traditional Kshirapak Vidhi for root nourishment and healthy hair vitality.
                </p>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-[#EAC9D1] text-[11px] text-[#7A5B64] space-y-1">
                <div className="font-bold text-[#45363B]">Footer Column Preview</div>
                <div>✓ Appears above copyright line</div>
                <div>✓ Preserves transparent PNG transparency</div>
              </div>
            </div>
          </div>

          {/* Controls: Upload & URL */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* File Upload Button */}
              <div className="sm:col-span-5">
                <input
                  type="file"
                  ref={footerFileInputRef}
                  onChange={handleFooterFileUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  id="footer-logo-file-input"
                />
                <button
                  type="button"
                  disabled={uploadingFooterLogo}
                  onClick={() => footerFileInputRef.current?.click()}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    uploadingFooterLogo
                      ? 'opacity-60 cursor-not-allowed bg-stone-100 border-stone-300 text-stone-600'
                      : isLight
                      ? 'bg-rose-50 border-rose-200 text-[#8C3A4F] hover:bg-rose-100 hover:border-rose-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/60'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingFooterLogo ? 'Uploading Footer Logo...' : 'Upload Footer Logo From Device'}</span>
                </button>
              </div>

              {/* Reset Button */}
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleResetFooterLogo}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default</span>
                </button>
              </div>

              <div className="sm:col-span-4 text-right">
                <span className="text-[11px] text-stone-400">
                  Recommended: Transparent PNG or SVG (250x70px)
                </span>
              </div>
            </div>

            {/* Direct Image URL input */}
            <div>
              <label className={`block font-semibold mb-1 text-xs ${isLight ? 'text-stone-600' : 'text-slate-400'}`}>
                Or Enter Footer Logo URL / Asset Path:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={footerLogoUrl}
                  onChange={(e) => setFooterLogoUrl(e.target.value)}
                  placeholder="/images/banners/herbic-cure-logo.png or https://..."
                  className={`w-full rounded-xl px-3.5 py-2 text-xs border outline-none font-mono ${
                    isLight
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                  }`}
                />
              </div>
            </div>

            {uploadFooterError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadFooterError}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. STORE IDENTITY & CONTACT                                               */}
        {/* ========================================================================= */}
        <div
          className={`rounded-3xl border p-6 shadow-xs space-y-4 ${
            isLight ? 'bg-white border-stone-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className={`flex items-center gap-2.5 pb-2 border-b ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <Store className="w-5 h-5 text-rose-500" />
            <h2 className={`text-sm font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
              Store Identity &amp; Contact
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-stone-600' : 'text-slate-400'}`}>
                Brand / Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2 border outline-none ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-stone-600' : 'text-slate-400'}`}>
                Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2 border outline-none ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-stone-600' : 'text-slate-400'}`}>
                Customer Helpline / WhatsApp
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2 border outline-none ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SHIPPING & FULFILLMENT                                                 */}
        {/* ========================================================================= */}
        <div
          className={`rounded-3xl border p-6 shadow-xs space-y-4 ${
            isLight ? 'bg-white border-stone-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className={`flex items-center gap-2.5 pb-2 border-b ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <Truck className="w-5 h-5 text-rose-500" />
            <h2 className={`text-sm font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
              Shipping &amp; Fulfillment
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-stone-600' : 'text-slate-400'}`}>
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                value={standardShippingFee}
                onChange={(e) => setStandardShippingFee(Number(e.target.value))}
                className={`w-full rounded-xl px-3.5 py-2 border outline-none ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                }`}
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Charged when cart subtotal is less than Free Delivery Min Order Value (₹{freeShippingThreshold}). Synced live across Cart Drawer, Cart Page, and Checkout.
              </p>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-stone-600' : 'text-slate-400'}`}>
                Free Delivery Min Order Value (₹)
              </label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className={`w-full rounded-xl px-3.5 py-2 border outline-none ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                }`}
              />
            </div>

            <div className="pt-2">
              <label
                className={`flex items-center gap-2 cursor-pointer ${
                  isLight ? 'text-stone-700' : 'text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                  className={`rounded-md w-4 h-4 accent-rose-600 ${
                    isLight ? 'border-slate-300' : 'border-slate-700'
                  }`}
                />
                <span className="font-semibold">Allow Cash on Delivery (COD) across India</span>
              </label>
            </div>

            {/* COD Advance Payment Sub-Section */}
            <div
              className={`mt-4 pt-4 border-t space-y-3.5 transition-all ${
                isLight ? 'border-stone-100' : 'border-slate-800'
              } ${!codEnabled ? 'opacity-40 pointer-events-none select-none' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <label
                    className={`flex items-center gap-2 font-semibold text-xs cursor-pointer ${
                      isLight ? 'text-stone-800' : 'text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!codEnabled}
                      checked={codAdvanceEnabled}
                      onChange={(e) => setCodAdvanceEnabled(e.target.checked)}
                      className={`rounded-md w-4 h-4 accent-rose-600 ${
                        isLight ? 'border-slate-300' : 'border-slate-700'
                      }`}
                    />
                    <span>Require advance payment for COD orders</span>
                  </label>
                  <p className={`text-[11px] mt-0.5 ml-6 ${isLight ? 'text-stone-400' : 'text-slate-500'}`}>
                    Protects against fake and fraudulent orders. Customer pays a small advance online; Delhivery collects the remaining balance on delivery.
                  </p>
                </div>
              </div>

              {codAdvanceEnabled && codEnabled && (
                <div
                  className={`ml-6 p-4 rounded-2xl border space-y-3.5 animate-fadeIn text-xs ${
                    isLight ? 'bg-stone-50/80 border-stone-200/90' : 'bg-slate-800/50 border-slate-700/80'
                  }`}
                >
                  {/* Advance Type Selector */}
                  <div>
                    <label className={`block font-semibold mb-1.5 text-[11px] ${isLight ? 'text-stone-700' : 'text-slate-300'}`}>
                      Advance Calculation Type
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-xs">
                        <input
                          type="radio"
                          name="codAdvanceType"
                          value="FIXED"
                          checked={codAdvanceType === 'FIXED'}
                          onChange={() => setCodAdvanceType('FIXED')}
                          className="accent-rose-600"
                        />
                        <span>Fixed Amount (₹)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-xs">
                        <input
                          type="radio"
                          name="codAdvanceType"
                          value="PERCENTAGE"
                          checked={codAdvanceType === 'PERCENTAGE'}
                          onChange={() => setCodAdvanceType('PERCENTAGE')}
                          className="accent-rose-600"
                        />
                        <span>Percentage of Order Total (%)</span>
                      </label>
                    </div>
                  </div>

                  {/* Value & Optional Cap Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-semibold mb-1 text-[11px] ${isLight ? 'text-stone-700' : 'text-slate-300'}`}>
                        {codAdvanceType === 'FIXED' ? 'Advance Amount (₹)' : 'Advance Percentage (%)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={codAdvanceType === 'PERCENTAGE' ? 100 : undefined}
                          value={codAdvanceValue}
                          onChange={(e) => setCodAdvanceValue(e.target.value)}
                          placeholder={codAdvanceType === 'FIXED' ? 'e.g. 99' : 'e.g. 15'}
                          className={`w-full rounded-xl px-3 py-2 text-xs border outline-none font-mono ${
                            isLight
                              ? 'bg-white border-stone-300 text-stone-900 focus:border-rose-600'
                              : 'bg-slate-900 border-slate-700 text-white focus:border-rose-500'
                          }`}
                        />
                        <span className="absolute right-3 top-2 text-[11px] text-stone-400 font-bold">
                          {codAdvanceType === 'FIXED' ? 'INR' : '%'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {codAdvanceType === 'FIXED'
                          ? 'Whole rupees, min ₹1. Deducted from COD collection.'
                          : 'Percentage between 1% and 100% of final order total.'}
                      </p>
                    </div>

                    {codAdvanceType === 'PERCENTAGE' && (
                      <div>
                        <label className={`block font-semibold mb-1 text-[11px] ${isLight ? 'text-stone-700' : 'text-slate-300'}`}>
                          Maximum Cap (₹) <span className="font-normal opacity-70">(Optional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            value={codAdvanceMaxCap}
                            onChange={(e) => setCodAdvanceMaxCap(e.target.value)}
                            placeholder="e.g. 200 (No cap if empty)"
                            className={`w-full rounded-xl px-3 py-2 text-xs border outline-none font-mono ${
                              isLight
                                ? 'bg-white border-stone-300 text-stone-900 focus:border-rose-600'
                                : 'bg-slate-900 border-slate-700 text-white focus:border-rose-500'
                            }`}
                          />
                          <span className="absolute right-3 top-2 text-[11px] text-stone-400 font-bold">
                            INR
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Ceiling limit so high cart totals don&apos;t require disproportionate advance.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Customer Message */}
                  <div>
                    <label className={`block font-semibold mb-1 text-[11px] ${isLight ? 'text-stone-700' : 'text-slate-300'}`}>
                      Customer-Facing Notice Message
                    </label>
                    <textarea
                      rows={2}
                      value={codAdvanceMessage}
                      onChange={(e) => setCodAdvanceMessage(e.target.value)}
                      placeholder="Pay a small advance online to confirm your COD order. The rest is paid on delivery."
                      className={`w-full rounded-xl p-2.5 text-xs border outline-none leading-relaxed ${
                        isLight
                          ? 'bg-white border-stone-300 text-stone-900 focus:border-rose-600'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-rose-500'
                      }`}
                    />
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Shown to shoppers on the checkout page before payment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Logistics Fulfillment Mode (Delhivery Pending vs Auto-Manifest) */}
            <div
              className={`mt-5 pt-5 border-t space-y-3.5 ${
                isLight ? 'border-stone-100' : 'border-slate-800'
              }`}
            >
              <div>
                <h3 className={`font-semibold text-xs ${isLight ? 'text-stone-800' : 'text-slate-200'}`}>
                  Logistics Fulfillment &amp; Manifestation Mode
                </h3>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-stone-400' : 'text-slate-500'}`}>
                  Controls whether website orders stay in Delhivery One Pending queue (unmanifested) for warehouse verification, or manifest automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pending Queue Option */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    shippingMode === 'delhivery_pending'
                      ? isLight
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300 text-stone-900'
                        : 'bg-rose-950/30 border-rose-700 ring-1 ring-rose-700 text-white'
                      : isLight
                      ? 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="shippingMode"
                      value="delhivery_pending"
                      checked={shippingMode === 'delhivery_pending'}
                      onChange={() => setShippingMode('delhivery_pending')}
                      className="accent-rose-600 mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs">Delhivery One Pending Queue</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-85">
                        Orders land in <strong>Delhivery One &gt; Forward Orders &gt; Pending</strong>. ₹0 deducted until staff review order and click <em>&quot;Get AWB number&quot;</em>. Protects against fake orders.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Auto Manifest Option */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    shippingMode === 'auto_manifest'
                      ? isLight
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300 text-stone-900'
                        : 'bg-rose-950/30 border-rose-700 ring-1 ring-rose-700 text-white'
                      : isLight
                      ? 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="shippingMode"
                      value="auto_manifest"
                      checked={shippingMode === 'auto_manifest'}
                      onChange={() => setShippingMode('auto_manifest')}
                      className="accent-rose-600 mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs">Direct Auto-Manifestation</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300">
                          Legacy
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-85">
                        AWB is generated immediately upon order confirmation. Shipping fees are deducted immediately from Delhivery account wallet balance.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          {saveErrorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveErrorMessage}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Store Branding & Settings'}</span>
          </button>
        </div>
      </form>

      {/* Security & Password Change Card */}
      <div className={`mt-8 rounded-3xl p-6 sm:p-7 border transition-all ${
        isLight
          ? 'bg-white border-stone-200/90 shadow-sm'
          : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        <div className={`flex items-center gap-2.5 pb-4 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-[#8C3A4F]/10 text-[#8C3A4F] flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
              Security &amp; Administrator Password
            </h2>
            <p className="text-xs text-stone-500">
              Update your administrator login password to protect your store management console.
            </p>
          </div>
        </div>

        {pwMessage && (
          <div className={`mt-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium border ${
            pwMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {pwMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{pwMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-stone-700' : 'text-slate-300'}`}>
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={`w-full rounded-xl pl-3.5 pr-9 py-2 text-xs border outline-none ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600 focus:bg-white'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-stone-700' : 'text-slate-300'}`}>
              New Password (Min 8 chars)
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={`w-full rounded-xl pl-3.5 pr-9 py-2 text-xs border outline-none ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600 focus:bg-white'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-stone-700' : 'text-slate-300'}`}>
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPw ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={`w-full rounded-xl pl-3.5 pr-9 py-2 text-xs border outline-none ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-rose-600 focus:bg-white'
                    : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showConfirmPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwSaving}
              className="px-6 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{pwSaving ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

