'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Truck,
  Heart,
  Leaf,
  Award,
  Check,
  Clock,
  Star,
  Flame,
  Layout,
  Layers,
  BookOpen,
  BarChart3,
  ListOrdered,
  Megaphone,
  Search,
  Eye,
} from 'lucide-react';
import { AboutPageData, DEFAULT_ABOUT_DATA } from '@/types/about';

const ICON_OPTIONS = [
  { value: 'shield', label: 'Shield (Protection / Authenticity)', icon: ShieldCheck },
  { value: 'sparkles', label: 'Sparkles (Magic / Infusion)', icon: Sparkles },
  { value: 'leaf', label: 'Leaf (Botanical / Pure Herbs)', icon: Leaf },
  { value: 'clock', label: 'Clock (72hr Slow Cooking / Time)', icon: Clock },
  { value: 'flame', label: 'Flame (Woodfire / Warm Brewing)', icon: Flame },
  { value: 'award', label: 'Award (Certified / Guarantee)', icon: Award },
  { value: 'heart', label: 'Heart (Loved by Customers)', icon: Heart },
  { value: 'check', label: 'Check (Verified Quality)', icon: Check },
  { value: 'star', label: 'Star (5-Star Results)', icon: Star },
  { value: 'truck', label: 'Truck (Express Pan-India Delivery)', icon: Truck },
];

function getIconComponent(iconName: string) {
  const match = ICON_OPTIONS.find((o) => o.value === iconName);
  const Icon = match ? match.icon : Sparkles;
  return <Icon className="w-4 h-4" />;
}

export default function AdminAboutPage() {
  const [data, setData] = useState<AboutPageData>(DEFAULT_ABOUT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<
    'hero' | 'philosophy' | 'mission' | 'stats' | 'process' | 'cta' | 'seo'
  >('hero');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/about');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to load About page data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'About Us page saved and published successfully!' });
        setIsDirty(false);
        setData(json.data);
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save changes' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all About Us page content to standard defaults? This will overwrite unsaved changes.'
      )
    ) {
      setData(DEFAULT_ABOUT_DATA);
      setIsDirty(true);
      setMessage({ type: 'success', text: 'Reset to standard defaults. Click Save to persist.' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success && json.url) {
        setData((prev) => ({
          ...prev,
          philosophy: { ...prev.philosophy, image: json.url },
        }));
        setIsDirty(true);
        setMessage({ type: 'success', text: 'Philosophy image uploaded successfully!' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Image upload failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error uploading image' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Helper updaters
  const updateHero = (field: string, val: string) => {
    setData((p) => ({ ...p, hero: { ...p.hero, [field]: val } }));
    setIsDirty(true);
  };

  const updatePhilosophy = (field: string, val: any) => {
    setData((p) => ({ ...p, philosophy: { ...p.philosophy, [field]: val } }));
    setIsDirty(true);
  };

  const updateHighlight = (idx: number, field: string, val: string) => {
    setData((p) => {
      const highlights = [...p.philosophy.highlights];
      highlights[idx] = { ...highlights[idx], [field]: val };
      return { ...p, philosophy: { ...p.philosophy, highlights } };
    });
    setIsDirty(true);
  };

  const updateMission = (field: string, val: any) => {
    setData((p) => ({ ...p, mission: { ...p.mission, [field]: val } }));
    setIsDirty(true);
  };

  const updatePillar = (idx: number, field: string, val: string) => {
    setData((p) => {
      const pillars = [...p.mission.pillars];
      pillars[idx] = { ...pillars[idx], [field]: val };
      return { ...p, mission: { ...p.mission, pillars } };
    });
    setIsDirty(true);
  };

  const updateStat = (idx: number, field: string, val: string) => {
    setData((p) => {
      const stats = [...p.stats];
      stats[idx] = { ...stats[idx], [field]: val };
      return { ...p, stats };
    });
    setIsDirty(true);
  };

  const updateProcess = (field: string, val: any) => {
    setData((p) => ({ ...p, process: { ...p.process, [field]: val } }));
    setIsDirty(true);
  };

  const updateProcessStep = (idx: number, field: string, val: string) => {
    setData((p) => {
      const steps = [...p.process.steps];
      steps[idx] = { ...steps[idx], [field]: val };
      return { ...p, process: { ...p.process, steps } };
    });
    setIsDirty(true);
  };

  const updateCta = (field: string, val: string) => {
    setData((p) => ({ ...p, ctaBanner: { ...p.ctaBanner, [field]: val } }));
    setIsDirty(true);
  };

  const updateSeo = (field: string, val: string) => {
    setData((p) => ({ ...p, seo: { ...p.seo, [field]: val } }));
    setIsDirty(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-[#8C3A4F] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#7A5B64]">Loading About Us page configuration...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'hero', label: '1. Hero Header', icon: Layout },
    { id: 'philosophy', label: '2. Philosophy & Story', icon: BookOpen },
    { id: 'mission', label: '3. Mission & Pillars', icon: Sparkles },
    { id: 'stats', label: '4. Proven Impact', icon: BarChart3 },
    { id: 'process', label: '5. 3-Step Process', icon: ListOrdered },
    { id: 'cta', label: '6. Bottom CTA', icon: Megaphone },
    { id: 'seo', label: '7. SEO & Metadata', icon: Search },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EAC9D1]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8C3A4F]/10 text-[#8C3A4F] uppercase tracking-wider">
              Storefront CMS
            </span>
            {isDirty && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Unsaved Changes
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#2D1B1B] mt-1">
            About Us Page Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#7A5B64] mt-0.5">
            Full control over narrative storytelling, philosophy, Kshirapak Vidhi method, impact stats, and SEO for{' '}
            <code className="text-[#8C3A4F] bg-rose-50 px-1 py-0.5 rounded">/about</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-[#EAC9D1] bg-white hover:bg-[#FDF0F4] text-[#8C3A4F] transition-all shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Page</span>
          </Link>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#8C3A4F] hover:bg-[#722E3F] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#EAC9D1]/70 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#8C3A4F] text-white shadow-xs'
                  : 'bg-white border border-[#EAC9D1] text-[#7A5B64] hover:text-[#2D1B1B] hover:bg-[#FDF0F4]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="bg-white border border-[#EAC9D1] rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* TAB 1: HERO HEADER */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">1. Hero Header Banner</h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                The top banner that introduces customers to Herbic Cure&apos;s story.
              </p>
            </div>

            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Top Pill Badge Text
                </label>
                <input
                  type="text"
                  value={data.hero.badge}
                  onChange={(e) => updateHero('badge', e.target.value)}
                  placeholder="e.g. Our Ancient Heritage"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-semibold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Main Hero Heading
                </label>
                <input
                  type="text"
                  value={data.hero.heading}
                  onChange={(e) => updateHero('heading', e.target.value)}
                  placeholder="e.g. Inspired by Himalayan Herbs. Crafted by Ayurveda."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-sm font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Hero Subtitle / Narrative Intro
                </label>
                <textarea
                  rows={3}
                  value={data.hero.subtitle}
                  onChange={(e) => updateHero('subtitle', e.target.value)}
                  placeholder="Enter the opening description for the About page..."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                />
              </div>
            </div>

            {/* Live Hero Preview Box */}
            <div className="pt-4 border-t border-[#EAC9D1]/60">
              <span className="text-xs font-bold text-[#7A5B64] flex items-center gap-1.5 mb-2">
                <Eye className="w-3.5 h-3.5 text-[#8C3A4F]" />
                Hero Section Preview
              </span>
              <div className="bg-[#f4ebe1] rounded-2xl p-8 text-center border border-stone-200">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/80 px-3 py-1 rounded-full mb-3">
                  {data.hero.badge || 'Badge Text'}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif max-w-xl mx-auto">
                  {data.hero.heading || 'Heading'}
                </h2>
                <p className="text-xs text-stone-600 mt-3 max-w-lg mx-auto leading-relaxed">
                  {data.hero.subtitle || 'Subtitle text'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PHILOSOPHY & STORY */}
        {activeTab === 'philosophy' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                2. Kshirapak Vidhi Philosophy & Narrative
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                The core brand explanation showcasing the 72-hour slow boiling method, feature highlights, and formulation image.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Text & CTA */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                    Section Tag / Badge
                  </label>
                  <input
                    type="text"
                    value={data.philosophy.badge}
                    onChange={(e) => updatePhilosophy('badge', e.target.value)}
                    placeholder="e.g. The Kshirapak Vidhi Method"
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-semibold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={data.philosophy.heading}
                    onChange={(e) => updatePhilosophy('heading', e.target.value)}
                    placeholder="e.g. Why Cold Infusion Makes All The Difference"
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-sm font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                    Detailed Story & Method Description
                  </label>
                  <textarea
                    rows={6}
                    value={data.philosophy.description}
                    onChange={(e) => updatePhilosophy('description', e.target.value)}
                    placeholder="Explain the slow 72-hour extraction, cold-pressed base oils, and 21 rare Himalayan roots..."
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={data.philosophy.ctaText}
                      onChange={(e) => updatePhilosophy('ctaText', e.target.value)}
                      placeholder="e.g. Explore Formulations"
                      className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-xs font-semibold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                      Button Link URL
                    </label>
                    <input
                      type="text"
                      value={data.philosophy.ctaUrl}
                      onChange={(e) => updatePhilosophy('ctaUrl', e.target.value)}
                      placeholder="e.g. /products"
                      className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Image Uploader & Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                    Philosophy Featured Image
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={data.philosophy.image}
                      onChange={(e) => updatePhilosophy('image', e.target.value)}
                      placeholder="e.g. /images/products/herbic-cure/herbic-cure-shampoo-healthy-hair.jpg"
                      className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                    />

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8C3A4F] text-white hover:bg-[#722E3F] cursor-pointer shadow-xs transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload New Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                      <span className="text-[11px] text-stone-500">Supports PNG, JPG, WebP</span>
                    </div>

                    {/* Image Preview Box */}
                    <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden border border-[#EAC9D1] bg-stone-100 mt-2">
                      {data.philosophy.image ? (
                        <Image
                          src={data.philosophy.image}
                          alt="Philosophy Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-stone-400">
                          No image selected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Feature Highlights Cards */}
            <div className="pt-6 border-t border-[#EAC9D1]/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C3A4F]">
                  4 Philosophy Feature Highlight Badges
                </h4>
                <span className="text-[11px] text-[#7A5B64]">Displayed next to the narrative</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.philosophy.highlights.map((hl, idx) => (
                  <div
                    key={hl.id || idx}
                    className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#EAC9D1] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8C3A4F]">Feature #{idx + 1}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-[#EAC9D1] text-[10px] font-bold text-stone-600">
                        {getIconComponent(hl.icon)}
                        <span>{hl.icon.toUpperCase()}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                        Select Icon
                      </label>
                      <select
                        value={hl.icon || 'shield'}
                        onChange={(e) => updateHighlight(idx, 'icon', e.target.value)}
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={hl.title}
                        onChange={(e) => updateHighlight(idx, 'title', e.target.value)}
                        placeholder="e.g. Zero Mineral Oil"
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={hl.subtitle}
                        onChange={(e) => updateHighlight(idx, 'subtitle', e.target.value)}
                        placeholder="e.g. 100% pure botanical base"
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MISSION & PILLARS */}
        {activeTab === 'mission' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                3. Brand Mission, Vision & 4 Core Pillars
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Defines Herbic Cure&apos;s guiding values, ethical sourcing standards, and promise to customers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Section Pill Badge
                </label>
                <input
                  type="text"
                  value={data.mission.badge}
                  onChange={(e) => updateMission('badge', e.target.value)}
                  placeholder="e.g. Our Core Purpose"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-semibold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={data.mission.heading}
                  onChange={(e) => updateMission('heading', e.target.value)}
                  placeholder="e.g. Purity, Ancient Wisdom & Proven Follicular Health"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-sm font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Mission Statement
                </label>
                <textarea
                  rows={4}
                  value={data.mission.missionText}
                  onChange={(e) => updateMission('missionText', e.target.value)}
                  placeholder="State the brand's core mission..."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Vision Statement
                </label>
                <textarea
                  rows={4}
                  value={data.mission.visionText}
                  onChange={(e) => updateMission('visionText', e.target.value)}
                  placeholder="State the brand's long-term vision..."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                />
              </div>
            </div>

            {/* 4 Pillars */}
            <div className="pt-4 border-t border-[#EAC9D1]/60 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C3A4F]">
                4 Core Brand Pillars
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.mission.pillars.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#EAC9D1] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8C3A4F]">Pillar #{idx + 1}</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#EAC9D1] text-[10px] font-bold text-stone-600">
                        {getIconComponent(p.icon)}
                        <span>{p.icon.toUpperCase()}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                        Pillar Icon
                      </label>
                      <select
                        value={p.icon || 'leaf'}
                        onChange={(e) => updatePillar(idx, 'icon', e.target.value)}
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                        Pillar Title
                      </label>
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) => updatePillar(idx, 'title', e.target.value)}
                        placeholder="e.g. Wild Himalayan Herbs"
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={p.description}
                        onChange={(e) => updatePillar(idx, 'description', e.target.value)}
                        placeholder="Describe this core commitment..."
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                4. Impact Numbers &amp; Proven Milestones (Stats Bar)
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                4 highlighted numbers displayed in a clean highlight strip on the About Us page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.stats.map((stat, idx) => (
                <div
                  key={stat.id || idx}
                  className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#EAC9D1] space-y-3"
                >
                  <span className="text-xs font-bold text-[#8C3A4F]">Metric #{idx + 1}</span>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                      Big Number / Value
                    </label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStat(idx, 'value', e.target.value)}
                      placeholder="e.g. 2,50,000+"
                      className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-base font-extrabold text-[#8C3A4F] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(idx, 'label', e.target.value)}
                      placeholder="e.g. Happy Customers"
                      className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                      Sub-label (Optional)
                    </label>
                    <input
                      type="text"
                      value={stat.helper || ''}
                      onChange={(e) => updateStat(idx, 'helper', e.target.value)}
                      placeholder="e.g. Across Pan-India"
                      className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#7A5B64] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Live Stats Preview */}
            <div className="pt-4 border-t border-[#EAC9D1]/60">
              <span className="text-xs font-bold text-[#7A5B64] flex items-center gap-1.5 mb-2">
                <Eye className="w-3.5 h-3.5 text-[#8C3A4F]" />
                Live Stats Bar Preview
              </span>
              <div className="bg-[#f4ebe1] rounded-2xl p-6 border border-stone-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {data.stats.map((s, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-2xl font-black text-[#A84358] font-serif">
                        {s.value || '0'}
                      </div>
                      <div className="text-xs font-bold text-stone-900">{s.label || 'Label'}</div>
                      {s.helper && <div className="text-[10px] text-stone-500">{s.helper}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: 3-STEP PROCESS */}
        {activeTab === 'process' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                5. The Sacred 3-Step Kshirapak Ritual
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Explains the authentic stages of wild foraging, 72-hour slow boiling in milk, and natural clarification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Section Pill Badge
                </label>
                <input
                  type="text"
                  value={data.process.badge}
                  onChange={(e) => updateProcess('badge', e.target.value)}
                  placeholder="e.g. Our Craftsmanship"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-semibold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={data.process.heading}
                  onChange={(e) => updateProcess('heading', e.target.value)}
                  placeholder="e.g. The Sacred 3-Step Kshirapak Ritual"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={data.process.subtitle}
                  onChange={(e) => updateProcess('subtitle', e.target.value)}
                  placeholder="e.g. A centuries-old medicinal preparation..."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAC9D1]/60 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C3A4F]">
                The 3 Steps
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.process.steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#EAC9D1] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-full bg-rose-100 text-[#8C3A4F] flex items-center justify-center font-bold text-xs">
                        {st.stepNumber || `0${idx + 1}`}
                      </span>
                      <input
                        type="text"
                        value={st.tag}
                        onChange={(e) => updateProcessStep(idx, 'tag', e.target.value)}
                        placeholder="e.g. ETHICAL HARVEST"
                        className="bg-white border border-[#EAC9D1] rounded-lg px-2 py-0.5 text-[10px] font-bold text-[#8C3A4F] uppercase text-right w-32 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                        Step Title
                      </label>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => updateProcessStep(idx, 'title', e.target.value)}
                        placeholder="e.g. Wild Foraging & Root Sun-Drying"
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                        Step Description
                      </label>
                      <textarea
                        rows={4}
                        value={st.description}
                        onChange={(e) => updateProcessStep(idx, 'description', e.target.value)}
                        placeholder="Describe this stage in detail..."
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BOTTOM CTA BANNER */}
        {activeTab === 'cta' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                6. Bottom Call to Action Banner
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Encourages readers at the end of the About Us page to explore formulations and ingredients.
              </p>
            </div>

            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Banner Main Heading
                </label>
                <input
                  type="text"
                  value={data.ctaBanner.heading}
                  onChange={(e) => updateCta('heading', e.target.value)}
                  placeholder="e.g. Experience Ancient Ayurvedic Hair Transformation"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-sm font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Banner Subtitle
                </label>
                <textarea
                  rows={2}
                  value={data.ctaBanner.subtitle}
                  onChange={(e) => updateCta('subtitle', e.target.value)}
                  placeholder="e.g. Join over 2,50,000 customers who revived their roots with authentic 21-herb Kshirapak hair oil."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#EAC9D1] space-y-3">
                  <span className="text-xs font-bold text-[#8C3A4F]">Primary Button</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={data.ctaBanner.primaryCtaText}
                      onChange={(e) => updateCta('primaryCtaText', e.target.value)}
                      placeholder="e.g. Shop All Formulations"
                      className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs font-bold text-[#2D1B1B] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                      Button Link URL
                    </label>
                    <input
                      type="text"
                      value={data.ctaBanner.primaryCtaUrl}
                      onChange={(e) => updateCta('primaryCtaUrl', e.target.value)}
                      placeholder="e.g. /products"
                      className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#EAC9D1] space-y-3">
                  <span className="text-xs font-bold text-[#8C3A4F]">Secondary Button</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={data.ctaBanner.secondaryCtaText}
                      onChange={(e) => updateCta('secondaryCtaText', e.target.value)}
                      placeholder="e.g. Explore 21 Ingredients"
                      className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs font-bold text-[#2D1B1B] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#45363B] mb-1">
                      Button Link URL
                    </label>
                    <input
                      type="text"
                      value={data.ctaBanner.secondaryCtaUrl}
                      onChange={(e) => updateCta('secondaryCtaUrl', e.target.value)}
                      placeholder="e.g. /ingredients"
                      className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SEO & METADATA */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                7. Search Engine Optimization (SEO)
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Controls the browser tab title, Google search result title, and meta description for <code className="text-[#8C3A4F]">/about</code>.
              </p>
            </div>

            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Meta Title Tag
                </label>
                <input
                  type="text"
                  value={data.seo.metaTitle}
                  onChange={(e) => updateSeo('metaTitle', e.target.value)}
                  placeholder="e.g. Our Heritage & Ayurvedic Science | Herbic Cure"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Recommended: 50-60 characters (Current: {data.seo.metaTitle.length})
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  value={data.seo.metaDescription}
                  onChange={(e) => updateSeo('metaDescription', e.target.value)}
                  placeholder="e.g. Discover how Herbic Cure revives ancient Kshirapak Vidhi using 21 rare Himalayan herbs for deep root nourishment."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Recommended: 120-160 characters (Current: {data.seo.metaDescription.length})
                </span>
              </div>
            </div>

            {/* Google SERP Card Preview */}
            <div className="pt-4 border-t border-[#EAC9D1]/60">
              <span className="text-xs font-bold text-[#7A5B64] flex items-center gap-1.5 mb-2">
                <Search className="w-3.5 h-3.5 text-[#8C3A4F]" />
                Google Search Result Preview
              </span>
              <div className="bg-white rounded-2xl p-4 border border-stone-200 max-w-xl shadow-xs">
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                  <span className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-bold text-rose-800">
                    H
                  </span>
                  <span>herbiccure.com &gt; about</span>
                </div>
                <h4 className="text-base text-[#1a0dab] hover:underline font-medium cursor-pointer leading-snug">
                  {data.seo.metaTitle || 'Our Heritage & Ayurvedic Science | Herbic Cure'}
                </h4>
                <p className="text-xs text-[#4d5156] mt-1 line-clamp-2 leading-relaxed">
                  {data.seo.metaDescription ||
                    'Discover how Herbic Cure revives ancient Kshirapak Vidhi using 21 rare Himalayan herbs for deep root nourishment.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save Bar on Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAC9D1] px-6 py-3.5 shadow-lg flex items-center justify-between gap-4 md:ml-64">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
          />
          <span className="text-xs font-semibold text-[#45363B]">
            {isDirty
              ? 'You have unsaved changes in your About Us page'
              : 'All About Us page content is saved and published'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/about"
            target="_blank"
            className="text-xs font-bold text-[#8C3A4F] hover:underline hidden sm:inline-block"
          >
            Preview Live
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#8C3A4F] hover:bg-[#722E3F] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
