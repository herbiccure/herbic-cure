'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Save,
  RotateCcw,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
  Layout,
  Plus,
  Trash2,
  Eye,
  Mail,
  Share2,
  Phone,
  Link as LinkIcon,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { FooterData, DEFAULT_FOOTER_DATA, FooterLink } from '@/lib/footer';

export default function AdminFooterPage() {
  const [data, setData] = useState<FooterData>(DEFAULT_FOOTER_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'brand' | 'columns' | 'newsletter' | 'social' | 'bottom'>('brand');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/footer');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load footer configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Footer updated and published to the live website!' });
        setIsDirty(false);
        setData(json.data);
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save footer' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving footer' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Reset all footer columns, links, social handles, and texts to standard defaults? This will overwrite unsaved changes.'
      )
    ) {
      setData(DEFAULT_FOOTER_DATA);
      setIsDirty(true);
      setMessage({ type: 'success', text: 'Reset to standard defaults. Click Save to persist.' });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
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
          brand: { ...prev.brand, logoUrl: json.url },
        }));
        setIsDirty(true);
        setMessage({ type: 'success', text: 'Footer logo uploaded successfully!' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Logo upload failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error uploading logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Updaters
  const updateBrand = (field: string, val: string) => {
    setData((p) => ({ ...p, brand: { ...p.brand, [field]: val } }));
    setIsDirty(true);
  };

  const updateContact = (field: string, val: any) => {
    setData((p) => ({ ...p, contact: { ...p.contact, [field]: val } }));
    setIsDirty(true);
  };

  const updateColumnTitle = (colIdx: number, title: string) => {
    setData((p) => {
      const columns = [...p.columns];
      columns[colIdx] = { ...columns[colIdx], title };
      return { ...p, columns };
    });
    setIsDirty(true);
  };

  const updateLink = (colIdx: number, linkIdx: number, field: keyof FooterLink, val: string) => {
    setData((p) => {
      const columns = [...p.columns];
      const links = [...columns[colIdx].links];
      links[linkIdx] = { ...links[linkIdx], [field]: val };
      columns[colIdx] = { ...columns[colIdx], links };
      return { ...p, columns };
    });
    setIsDirty(true);
  };

  const handleAddLink = (colIdx: number) => {
    setData((p) => {
      const columns = [...p.columns];
      const newId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      columns[colIdx] = {
        ...columns[colIdx],
        links: [...columns[colIdx].links, { id: newId, label: 'New Link', url: '/' }],
      };
      return { ...p, columns };
    });
    setIsDirty(true);
  };

  const handleRemoveLink = (colIdx: number, linkIdx: number) => {
    setData((p) => {
      const columns = [...p.columns];
      const links = columns[colIdx].links.filter((_, i) => i !== linkIdx);
      columns[colIdx] = { ...columns[colIdx], links };
      return { ...p, columns };
    });
    setIsDirty(true);
  };

  const updateNewsletter = (field: string, val: string) => {
    setData((p) => ({ ...p, newsletter: { ...p.newsletter, [field]: val } }));
    setIsDirty(true);
  };

  const updateSocial = (platform: string, val: string) => {
    setData((p) => ({ ...p, socialLinks: { ...p.socialLinks, [platform]: val } }));
    setIsDirty(true);
  };

  const updateBottom = (field: string, val: any) => {
    setData((p) => ({ ...p, bottomBar: { ...p.bottomBar, [field]: val } }));
    setIsDirty(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-[#8C3A4F] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#7A5B64]">Loading Footer configuration...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'brand', label: '1. Brand & Contact', icon: Layout },
    { id: 'columns', label: '2. Navigation Columns (3)', icon: LinkIcon },
    { id: 'newsletter', label: '3. Newsletter Card', icon: Mail },
    { id: 'social', label: '4. Social Media', icon: Share2 },
    { id: 'bottom', label: '5. Bottom Bar & Wave', icon: Sliders },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
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
            Footer CMS Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#7A5B64] mt-0.5">
            Customize the brand blurb, navigation menus, links, newsletter widget, social channels, and copyright across the entire store.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-[#EAC9D1] bg-white hover:bg-[#FDF0F4] text-[#8C3A4F] transition-all shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Store</span>
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

      {/* Tabs Switcher */}
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
        {/* TAB 1: BRAND IDENTITY & CONTACT */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">1. Brand Identity &amp; Contact Desk</h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                The left brand column in the footer containing your logo, brand name, tagline, description, and support contacts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Brand Names & Text */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">Brand Name</label>
                  <input
                    type="text"
                    value={data.brand.brandName}
                    onChange={(e) => updateBrand('brandName', e.target.value)}
                    placeholder="e.g. HERBIC CURE"
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden uppercase tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">Brand Tagline</label>
                  <input
                    type="text"
                    value={data.brand.tagline}
                    onChange={(e) => updateBrand('tagline', e.target.value)}
                    placeholder="e.g. Inspired by Himalayan Herbs"
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden italic"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">Footer Description Blurb</label>
                  <textarea
                    rows={4}
                    value={data.brand.description}
                    onChange={(e) => updateBrand('description', e.target.value)}
                    placeholder="Brief description of the brand's authentic Ayurvedic roots and formulations..."
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Column: Logo Upload & Contact Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">Footer Logo</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={data.brand.logoUrl || ''}
                      onChange={(e) => updateBrand('logoUrl', e.target.value)}
                      placeholder="/images/banners/herbic-cure-logo.png"
                      className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-xs text-[#2D1B1B] outline-hidden"
                    />

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8C3A4F] text-white hover:bg-[#722E3F] cursor-pointer shadow-xs transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </label>
                      <span className="text-[11px] text-stone-500">Supports transparent PNG, SVG, JPG</span>
                    </div>

                    <div className="p-3 bg-[#F6DFE7]/50 border border-[#EAC9D1] rounded-2xl flex items-center justify-center h-20">
                      {data.brand.logoUrl ? (
                        <div className="relative w-40 h-14">
                          <Image
                            src={data.brand.logoUrl}
                            alt="Footer Logo"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">No logo uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Support Contact Info */}
                <div className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#EAC9D1] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8C3A4F] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Customer Support Desk Info
                    </span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.contact.showContact}
                        onChange={(e) => updateContact('showContact', e.target.checked)}
                        className="rounded text-[#8C3A4F] focus:ring-[#8C3A4F]"
                      />
                      <span>Show in Footer</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">Support Email</label>
                      <input
                        type="text"
                        value={data.contact.email}
                        onChange={(e) => updateContact('email', e.target.value)}
                        placeholder="support@herbiccure.com"
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#45363B] mb-1">Phone / WhatsApp</label>
                      <input
                        type="text"
                        value={data.contact.phone}
                        onChange={(e) => updateContact('phone', e.target.value)}
                        placeholder="+91 8121961219"
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#45363B] mb-1">Operating Hours</label>
                    <input
                      type="text"
                      value={data.contact.hours}
                      onChange={(e) => updateContact('hours', e.target.value)}
                      placeholder="Mon - Sat: 10:00 AM - 7:00 PM IST"
                      className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs text-[#2D1B1B] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NAVIGATION COLUMNS */}
        {activeTab === 'columns' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                2. Navigation Link Columns
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Customize column headings and add, edit, or remove links in each of the 3 columns (Collections, About, and Useful Links).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {data.columns.map((col, colIdx) => (
                <div
                  key={col.id || colIdx}
                  className="bg-[#FCF8F9] border border-[#EAC9D1] rounded-2xl p-4 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Column Heading */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C3A4F]">
                        Column #{colIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={col.title}
                        onChange={(e) => updateColumnTitle(colIdx, e.target.value)}
                        placeholder="COLUMN TITLE"
                        className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2 text-xs font-extrabold text-[#A84358] uppercase tracking-wider mt-1 outline-hidden"
                      />
                    </div>

                    {/* Links List */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#7A5B64] px-1">
                        <span>Links ({col.links.length})</span>
                      </div>

                      {col.links.map((link, linkIdx) => (
                        <div
                          key={link.id || linkIdx}
                          className="bg-white border border-[#EAC9D1]/80 rounded-xl p-2.5 space-y-2 relative shadow-2xs group hover:border-[#8C3A4F]/40 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-stone-500">
                              #{linkIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(colIdx, linkIdx)}
                              className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete link"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) =>
                                updateLink(colIdx, linkIdx, 'label', e.target.value)
                              }
                              placeholder="Link text"
                              className="w-full bg-[#FCF8F9] border border-stone-200 rounded-lg p-1.5 text-xs font-semibold text-[#2D1B1B] outline-hidden"
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) =>
                                updateLink(colIdx, linkIdx, 'url', e.target.value)
                              }
                              placeholder="Target URL (e.g. /about)"
                              className="w-full bg-[#FCF8F9] border border-stone-200 rounded-lg p-1.5 text-xs text-stone-600 outline-hidden font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Link Button */}
                  <button
                    type="button"
                    onClick={() => handleAddLink(colIdx)}
                    className="w-full py-2 bg-white border border-dashed border-[#8C3A4F]/40 hover:border-[#8C3A4F] text-[#8C3A4F] hover:bg-rose-50/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: NEWSLETTER CARD */}
        {activeTab === 'newsletter' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                3. Newsletter Subscription Card
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                The callout card in the right column encouraging customers to sign up for deals and herbal tips.
              </p>
            </div>

            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Card Heading
                </label>
                <input
                  type="text"
                  value={data.newsletter.heading}
                  onChange={(e) => updateNewsletter('heading', e.target.value)}
                  placeholder="e.g. Join our newsletter for exclusive deals!"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-sm font-bold text-[#2D1B1B] focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                    Input Field Placeholder
                  </label>
                  <input
                    type="text"
                    value={data.newsletter.placeholder}
                    onChange={(e) => updateNewsletter('placeholder', e.target.value)}
                    placeholder="e.g. Enter your email"
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                    Submit Button Text
                  </label>
                  <input
                    type="text"
                    value={data.newsletter.buttonText}
                    onChange={(e) => updateNewsletter('buttonText', e.target.value)}
                    placeholder="e.g. Subscribe"
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-bold text-[#2D1B1B] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Spam Disclaimer / Subtext
                </label>
                <input
                  type="text"
                  value={data.newsletter.subtext}
                  onChange={(e) => updateNewsletter('subtext', e.target.value)}
                  placeholder="e.g. Zero spam. Only authentic Ayurvedic hair wellness updates & VIP discounts."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Success Confirmation Message
                </label>
                <input
                  type="text"
                  value={data.newsletter.successMessage}
                  onChange={(e) => updateNewsletter('successMessage', e.target.value)}
                  placeholder="e.g. Thank you! You will receive our secret Ayurvedic offers."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOCIAL MEDIA */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                4. Social Media Channels
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Floating social link buttons shown at the bottom of the footer. Leave empty to hide any channel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Facebook URL
                </label>
                <input
                  type="text"
                  value={data.socialLinks.facebook}
                  onChange={(e) => updateSocial('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Instagram URL
                </label>
                <input
                  type="text"
                  value={data.socialLinks.instagram}
                  onChange={(e) => updateSocial('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  WhatsApp Support Link / Number
                </label>
                <input
                  type="text"
                  value={data.socialLinks.whatsapp}
                  onChange={(e) => updateSocial('whatsapp', e.target.value)}
                  placeholder="https://wa.me/918121961219"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  YouTube Channel URL (Optional)
                </label>
                <input
                  type="text"
                  value={data.socialLinks.youtube || ''}
                  onChange={(e) => updateSocial('youtube', e.target.value)}
                  placeholder="https://youtube.com/@herbiccure"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Twitter / X URL (Optional)
                </label>
                <input
                  type="text"
                  value={data.socialLinks.twitter || ''}
                  onChange={(e) => updateSocial('twitter', e.target.value)}
                  placeholder="https://x.com/herbiccure"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs text-[#2D1B1B] outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BOTTOM BAR & WAVE */}
        {activeTab === 'bottom' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAC9D1]/60 pb-3">
              <h3 className="text-base font-bold text-[#2D1B1B] font-serif">
                5. Bottom Bar &amp; Organic Wave
              </h3>
              <p className="text-xs text-[#7A5B64] mt-0.5">
                Copyright notice and visual organic curve transition separating the main page from the footer.
              </p>
            </div>

            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-xs font-bold text-[#45363B] mb-1.5">
                  Copyright Notice Text
                </label>
                <input
                  type="text"
                  value={data.bottomBar.copyright}
                  onChange={(e) => updateBottom('copyright', e.target.value)}
                  placeholder="e.g. @Herbic Cure. All Rights Reserved."
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-xs font-semibold text-[#2D1B1B] outline-hidden"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#45363B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.bottomBar.showOrganicWave}
                    onChange={(e) => updateBottom('showOrganicWave', e.target.checked)}
                    className="rounded text-[#8C3A4F] focus:ring-[#8C3A4F] w-4 h-4"
                  />
                  <span>Show Organic SVG Wave Curve on Top of Footer</span>
                </label>
                <p className="text-[11px] text-stone-500 mt-1">
                  Provides a smooth organic transition curve between the page content and the rose-blush footer background.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIVE FOOTER STOREFRONT PREVIEW */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#45363B] flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#8C3A4F]" />
            Live Footer Storefront Preview
          </span>
          <span className="text-[10px] text-stone-500">Updates live as you make changes</span>
        </div>

        <div className="bg-[#F6DFE7] border border-[#EAC9D1] rounded-3xl overflow-hidden shadow-xs">
          {data.bottomBar.showOrganicWave && (
            <div className="w-full overflow-hidden leading-none pointer-events-none -mt-1">
              <svg
                viewBox="0 0 1440 85"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-8 object-cover"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,0 C320,55 580,75 880,45 C1160,15 1320,65 1440,30 L1440,0 L0,0 Z"
                  className="fill-white"
                />
              </svg>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 text-[#2D1B1B]">
              {/* Brand Col */}
              <div className="lg:col-span-3 space-y-2">
                <span className="font-serif tracking-widest text-base font-bold text-[#45363B] uppercase">
                  {data.brand.brandName || 'HERBIC CURE'}
                </span>
                <p className="text-[11px] text-stone-600 italic">
                  {data.brand.tagline || 'Inspired by Himalayan Herbs'}
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {data.brand.description}
                </p>
                {data.contact.showContact && (
                  <div className="text-[10px] text-stone-600 pt-1 space-y-0.5">
                    <div>📧 {data.contact.email}</div>
                    <div>📞 {data.contact.phone}</div>
                  </div>
                )}
              </div>

              {/* 3 Nav Columns */}
              {data.columns.map((col, idx) => (
                <div key={idx} className="lg:col-span-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#A84358] pb-1 inline-block border-b-2 border-stone-800">
                    {col.title}
                  </h4>
                  <ul className="mt-2.5 space-y-1.5 text-[11px] text-stone-700 font-medium">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx} className="hover:text-[#A84358] transition-colors">
                        {link.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Newsletter Col */}
              <div className="lg:col-span-3 space-y-2">
                <h4 className="text-xs font-bold text-stone-900">{data.newsletter.heading}</h4>
                <div className="flex bg-white rounded-xl p-1 shadow-xs border border-stone-200">
                  <input
                    type="text"
                    disabled
                    placeholder={data.newsletter.placeholder}
                    className="flex-1 px-2 text-[11px] outline-hidden bg-transparent"
                  />
                  <button
                    disabled
                    className="bg-stone-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"
                  >
                    {data.newsletter.buttonText}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500">{data.newsletter.subtext}</p>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-8 pt-4 border-t border-stone-300/60 flex items-center justify-between text-xs text-stone-600">
              <p>{data.bottomBar.copyright}</p>
              <div className="flex items-center gap-2">
                {data.socialLinks.facebook && <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold">f</span>}
                {data.socialLinks.instagram && <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold">ig</span>}
                {data.socialLinks.whatsapp && <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold">wa</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAC9D1] px-6 py-3.5 shadow-lg flex items-center justify-between gap-4 md:ml-64">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
          />
          <span className="text-xs font-semibold text-[#45363B]">
            {isDirty
              ? 'You have unsaved changes in your Footer'
              : 'All Footer settings and navigation are published'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-xs font-bold text-[#8C3A4F] hover:underline hidden sm:inline-block"
          >
            Preview on Store
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
