'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Settings,
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
  Sparkles,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';

const DEFAULT_LOGO_URL = '/images/banners/herbic-cure-logo.png';

export default function AdminSettingsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [storeName, setStoreName] = useState('Herbic Cure');
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const [supportEmail, setSupportEmail] = useState('care@herbiccure.com');
  const [supportPhone, setSupportPhone] = useState('+91 8121961219');
  const [codEnabled, setCodEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(499);
  const [standardShippingFee, setStandardShippingFee] = useState(49);
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          if (s.brand_name) setStoreName(s.brand_name);
          if (s.store_logo || s.logo_url) setLogoUrl(s.store_logo || s.logo_url);
          if (s.contact_email) setSupportEmail(s.contact_email);
          if (s.contact_phone) setSupportPhone(s.contact_phone);
          if (s.cod_available !== undefined) setCodEnabled(s.cod_available === 'true');
          if (s.free_shipping_threshold) setFreeShippingThreshold(Number(s.free_shipping_threshold));
          if (s.standard_shipping_fee) setStandardShippingFee(Number(s.standard_shipping_fee));
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: storeName,
          store_logo: logoUrl,
          logo_url: logoUrl,
          contact_email: supportEmail,
          contact_phone: supportPhone,
          cod_available: codEnabled ? 'true' : 'false',
          free_shipping_threshold: String(freeShippingThreshold),
          standard_shipping_fee: String(standardShippingFee),
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
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
        {/* 1. BRAND LOGO & VISUAL IDENTITY (FULL WIDTH)                              */}
        {/* ========================================================================= */}
        <div
          className={`lg:col-span-2 rounded-3xl border p-6 shadow-sm space-y-6 ${
            isLight ? 'bg-white border-stone-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#A84358]/10 text-[#A84358] flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  Store Logo &amp; Header Branding
                </h2>
                <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-slate-400'}`}>
                  This logo displays on the main website header, sticky scrolled bar, mobile menu, and footer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active on Storefront
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
            <div className="rounded-2xl border border-stone-200/90 dark:border-slate-700 bg-[#FFFFFF] shadow-sm overflow-hidden p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Simulated Left Search bar */}
              <div className="w-full md:w-72 bg-stone-100 rounded-full px-4 py-2 flex items-center gap-2 text-stone-400 text-xs shrink-0 select-none">
                <span className="text-stone-400">🔍</span>
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
                  <span className="text-xs text-stone-400 italic">No logo selected</span>
                )}
              </div>

              {/* Simulated Right utilities */}
              <div className="hidden sm:flex items-center gap-3 shrink-0 select-none">
                <span className="text-xs font-medium text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                  📞 Ayurvedic Expert
                </span>
                <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-full">
                  Bag (0)
                </span>
              </div>
            </div>
          </div>

          {/* Dual Background Contrast Checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Light Canvas */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Light Background (Header View)
              </span>
              <div className="relative h-16 w-48 flex items-center justify-center bg-stone-50 rounded-xl p-2 border border-stone-100">
                {logoUrl && (
                  <Image
                    src={logoUrl}
                    alt="Light Preview"
                    width={180}
                    height={50}
                    className="object-contain max-h-14"
                    unoptimized
                  />
                )}
              </div>
            </div>

            {/* Dark Canvas (Footer / Dark Mode) */}
            <div className="p-4 rounded-2xl bg-[#2D1B1B] border border-rose-950 flex flex-col items-center justify-center text-center gap-2 text-white">
              <span className="text-[11px] font-bold text-rose-200/80 uppercase tracking-wider">
                Dark Background (Footer View)
              </span>
              <div className="relative h-16 w-48 flex items-center justify-center bg-black/20 rounded-xl p-2 border border-white/10">
                {logoUrl && (
                  <Image
                    src={logoUrl}
                    alt="Dark Preview"
                    width={180}
                    height={50}
                    className="object-contain max-h-14"
                    unoptimized
                  />
                )}
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
                  <span>{uploadingLogo ? 'Uploading Logo...' : 'Upload Logo From Device'}</span>
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
                Or Enter Logo Image URL / Asset Path:
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
          </div>
        </div>

        {/* Action Button */}
        <div className="lg:col-span-2 flex justify-end">
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
    </div>
  );
}
