'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PolicyRenderer from '@/components/ui/PolicyRenderer';
import {
  FileText,
  Shield,
  RotateCcw,
  Truck,
  Save,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  Check,
} from 'lucide-react';
import { DEFAULT_POLICIES, PolicyData } from '@/lib/policies';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';

const POLICY_TABS = [
  {
    slug: 'terms',
    name: 'Terms & Conditions',
    publicUrl: '/terms',
    icon: FileText,
  },
  {
    slug: 'privacy-policy',
    name: 'Privacy Policy',
    publicUrl: '/privacy-policy',
    icon: Shield,
  },
  {
    slug: 'refund-policy',
    name: 'Cancellation & Refund',
    publicUrl: '/refund-policy',
    icon: RotateCcw,
  },
  {
    slug: 'shipping-policy',
    name: 'Shipping & Delivery',
    publicUrl: '/shipping-policy',
    icon: Truck,
  },
];

export default function AdminPoliciesPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [activeSlug, setActiveSlug] = useState('refund-policy');
  const [policyData, setPolicyData] = useState<Record<string, PolicyData>>(DEFAULT_POLICIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');

  useEffect(() => {
    async function loadPolicies() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/policies');
        const json = await res.json();
        if (json.success && json.policies) {
          const map: Record<string, PolicyData> = {};
          json.policies.forEach((p: PolicyData) => {
            map[p.slug] = p;
          });
          setPolicyData((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error('Failed to load policies', err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const currentPolicy = policyData[activeSlug] || DEFAULT_POLICIES[activeSlug];

  const handleFieldChange = (field: keyof PolicyData, value: string) => {
    setPolicyData((prev) => ({
      ...prev,
      [activeSlug]: {
        ...prev[activeSlug],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPolicy),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Published! '${currentPolicy.title}' is now live on the storefront.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to save policy.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Network error while saving.',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleRestoreTemplate = () => {
    if (
      confirm(
        `Restore the senior-lawyer crafted default template for '${currentPolicy.title}'? Any unsaved edits will be replaced.`
      )
    ) {
      const template = DEFAULT_POLICIES[activeSlug];
      if (template) {
        setPolicyData((prev) => ({
          ...prev,
          [activeSlug]: { ...template },
        }));
        setFeedback({
          type: 'success',
          message: 'Template restored. Click "Save & Publish" to commit changes.',
        });
      }
    }
  };

  const insertSnippet = (snippet: string) => {
    const textarea = document.getElementById('policy-content-editor') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentPolicy.content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newContent = `${before}${snippet}${after}`;
    handleFieldChange('content', newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  const activeTabMeta = POLICY_TABS.find((t) => t.slug === activeSlug) || POLICY_TABS[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              Legal &amp; Compliance CMS
            </span>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Database Synced
            </span>
          </div>
          <h1 className={`text-2xl font-bold font-serif ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Store Policies &amp; Legal Disclaimers
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Configure terms, medical disclaimers, privacy policies, and refund rules. Updates reflect instantly on public pages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={activeTabMeta.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>View Live Page</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{ color: '#ffffff' }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#A84358] hover:bg-[#45363B] disabled:opacity-50 text-white-force text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white-force" style={{ color: '#ffffff' }} />
            ) : (
              <Save className="w-3.5 h-3.5 text-white-force" style={{ color: '#ffffff' }} />
            )}
            <span className="text-white-force" style={{ color: '#ffffff' }}>
              {saving ? 'Publishing...' : 'Save & Publish Live'}
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-xs font-semibold transition-all ${
            feedback.type === 'success'
              ? isLight
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              : isLight
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
          ) : (
            <AlertCircle className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Policy Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {POLICY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.slug === activeSlug;
          return (
            <button
              key={tab.slug}
              type="button"
              onClick={() => setActiveSlug(tab.slug)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? isLight
                    ? 'bg-rose-50/90 border-2 border-rose-600 shadow-xs ring-2 ring-rose-600/15'
                    : 'bg-rose-950/40 border-2 border-rose-500 text-white shadow-md ring-2 ring-rose-500/20'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {/* Icon Container with Guaranteed Contrast in Both Themes */}
              <div
                className={`p-2.5 rounded-xl border shrink-0 transition-all ${
                  isActive
                    ? isLight
                      ? 'bg-[#A84358] border-[#A84358] text-white-force shadow-xs'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-500'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                style={isActive && isLight ? { backgroundColor: '#A84358', color: '#ffffff' } : {}}
              >
                <Icon
                  className="w-4 h-4"
                  style={isActive && isLight ? { color: '#ffffff' } : {}}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-xs truncate ${
                      isActive
                        ? isLight
                          ? 'font-black text-rose-950'
                          : 'font-extrabold text-white'
                        : isLight
                        ? 'font-semibold text-slate-800'
                        : 'font-medium text-slate-300'
                    }`}
                  >
                    {tab.name}
                  </p>
                  {isActive && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                        isLight
                          ? 'bg-rose-200 text-rose-950 border border-rose-300'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p
                  className={`text-[10px] font-mono truncate mt-0.5 ${
                    isActive
                      ? isLight
                        ? 'text-rose-700 font-semibold'
                        : 'text-rose-400'
                      : isLight
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {tab.publicUrl}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Card */}
      <div
        className={`rounded-3xl border p-4 sm:p-6 space-y-5 shadow-xs transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Metadata Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Display Title
            </label>
            <input
              type="text"
              value={currentPolicy.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2 text-xs transition border focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600/30'
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
              }`}
              placeholder="e.g. Terms & Conditions of Sale & Service"
            />
          </div>

          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Header Badge Text
            </label>
            <input
              type="text"
              value={currentPolicy.badge}
              onChange={(e) => handleFieldChange('badge', e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2 text-xs transition border focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600/30'
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
              }`}
              placeholder="e.g. Official Legal Instrument"
            />
          </div>

          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Last Updated / Effective Date
            </label>
            <input
              type="text"
              value={currentPolicy.lastUpdated}
              onChange={(e) => handleFieldChange('lastUpdated', e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2 text-xs transition border focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600/30'
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
              }`}
              placeholder="e.g. October 11, 2026"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Header Subtitle / Statutory Summary
            </label>
            <input
              type="text"
              value={currentPolicy.subtitle}
              onChange={(e) => handleFieldChange('subtitle', e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2 text-xs transition border focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600/30'
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
              }`}
              placeholder="Brief summary displayed under the main heading"
            />
          </div>
        </div>

        {/* Action Toolbar & View Mode Switcher */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className={`text-[11px] font-semibold mr-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Insert Format:
            </span>
            <button
              type="button"
              onClick={() => insertSnippet('\n### Section Title\n')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-2xs'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              + Heading
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('**Important Keyword** ')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-2xs'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n- Point 1\n- Point 2\n')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-2xs'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n> [!WARNING]\n> Notice message...\n')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800 shadow-2xs'
                  : 'bg-rose-950/60 hover:bg-rose-900/60 border-rose-800/50 text-rose-300'
              }`}
            >
              + Warning Callout
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n> [!NOTE]\n> Protocol information...\n')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800 shadow-2xs'
                  : 'bg-rose-950/60 hover:bg-rose-900/60 border-rose-800/50 text-rose-300'
              }`}
            >
              + Note Callout
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRestoreTemplate}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-800/40 text-amber-400'
              }`}
              title="Reset to senior-lawyer crafted default template"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
              <span>Reset to Lawyer Template</span>
            </button>

            {/* View Mode Switcher with Crisp Active Indication in Both Themes */}
            <div
              className={`flex items-center rounded-xl p-1 border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'edit'
                    ? isLight
                      ? 'bg-white text-rose-950 font-black shadow-xs border border-rose-600/30'
                      : 'bg-slate-800 text-rose-400 font-bold border border-slate-700 shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'preview'
                    ? isLight
                      ? 'bg-white text-rose-950 font-black shadow-xs border border-rose-600/30'
                      : 'bg-slate-800 text-rose-400 font-bold border border-slate-700 shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'split'
                    ? isLight
                      ? 'bg-white text-rose-950 font-black shadow-xs border border-rose-600/30'
                      : 'bg-slate-800 text-rose-400 font-bold border border-slate-700 shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Editor & Live Storefront Preview Area */}
        <div
          className={`grid gap-5 ${
            viewMode === 'split' ? 'lg:grid-cols-2 grid-cols-1' : 'grid-cols-1'
          }`}
        >
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="space-y-2">
              <div
                className={`flex items-center justify-between text-[11px] font-mono ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                <span className="font-bold">MARKDOWN CONTENT EDITOR</span>
                <span>{currentPolicy.content.length} characters</span>
              </div>
              <textarea
                id="policy-content-editor"
                value={currentPolicy.content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                rows={22}
                className={`w-full rounded-2xl p-4 text-xs font-mono leading-relaxed resize-y transition border focus:outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600/30'
                    : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                }`}
                placeholder="Type or paste policy content..."
              />
            </div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="space-y-2">
              <div
                className={`flex items-center justify-between text-[11px] font-mono ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                <span className="font-bold">LIVE STOREFRONT PREVIEW</span>
                <span className={`font-semibold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                  Client Perspective
                </span>
              </div>
              <div
                className={`rounded-2xl border p-6 sm:p-8 max-h-[580px] overflow-y-auto shadow-sm text-stone-900 bg-white ${
                  isLight ? 'border-slate-300' : 'border-slate-800'
                }`}
              >
                <div className="border-b border-stone-200 pb-4 mb-6">
                  {currentPolicy.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {currentPolicy.badge}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-extrabold font-serif text-stone-900 mt-2">
                    {currentPolicy.title}
                  </h2>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Effective: {currentPolicy.lastUpdated}
                  </p>
                  {currentPolicy.subtitle && (
                    <p className="text-xs text-stone-600 mt-2 font-medium italic">
                      {currentPolicy.subtitle}
                    </p>
                  )}
                </div>

                <PolicyRenderer content={currentPolicy.content} />
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Save */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t text-xs ${
            isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}
        >
          <p>
            Saved policies update the database via Prisma and publish to{' '}
            <code className={`font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
              {activeTabMeta.publicUrl}
            </code>{' '}
            instantly.
          </p>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{ color: '#ffffff' }}
            className="px-5 py-2.5 bg-[#A84358] hover:bg-[#45363B] disabled:opacity-50 text-white-force font-bold rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
          >
            <span className="text-white-force" style={{ color: '#ffffff' }}>
              {saving ? 'Publishing...' : 'Save & Publish Live'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
