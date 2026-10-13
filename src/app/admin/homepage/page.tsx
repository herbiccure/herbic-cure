'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Edit,
  CheckCircle,
  ExternalLink,
  Save,
  Layers,
  Tag,
  Sparkles,
  LayoutGrid,
  Star,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminHomepageBuilderPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Taskbar Offers section toggle state (defaults to false / OFF)
  const [navbarOffersEnabled, setNavbarOffersEnabled] = useState(false);
  const [togglingNavbarOffers, setTogglingNavbarOffers] = useState(false);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/admin/homepage');
      const data = await res.json();
      if (data.sections) setSections(data.sections);
      if (typeof data.navbarOffersEnabled === 'boolean') {
        setNavbarOffersEnabled(data.navbarOffersEnabled);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleToggleNavbarOffers = async () => {
    const nextVal = !navbarOffersEnabled;
    setTogglingNavbarOffers(true);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          navbarOffersEnabled: nextVal,
          syncOfferBanner: true,
        }),
      });
      if (res.ok) {
        setNavbarOffersEnabled(nextVal);
        setSections((prev) =>
          prev.map((s) => (s.sectionType === 'OFFER_BANNER' ? { ...s, active: nextVal } : s))
        );
        toast.success(
          nextVal
            ? 'Offers section TURNED ON in taskbar and homepage'
            : 'Offers section TURNED OFF in taskbar and homepage'
        );
      } else {
        toast.error('Failed to update taskbar setting');
      }
    } catch {
      toast.error('Network error updating taskbar setting');
    } finally {
      setTogglingNavbarOffers(false);
    }
  };

  const handleToggleActive = async (s: any) => {
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, active: !s.active }),
      });
      if (res.ok) {
        setSections(sections.map((item) => (item.id === s.id ? { ...item, active: !s.active } : item)));
        toast.success(`Section ${!s.active ? 'enabled' : 'disabled'}`);
      }
    } catch {
      toast.error('Failed to toggle section');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    setSections(copy);

    try {
      const reorderedIds = copy.map((s) => s.id);
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: reorderedIds }),
      });
      if (!res.ok) throw new Error('Failed to save order');
      toast.success(`Moved "${temp.title || temp.sectionType}" ${direction}`);
    } catch {
      toast.error('Failed to save new section order');
      fetchSections();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSection.id,
          title: editingSection.title,
          subtitle: editingSection.subtitle,
          contentJson: editingSection.contentJson,
        }),
      });
      if (res.ok) {
        await fetchSections();
        setEditingSection(null);
        toast.success('Section content saved');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Homepage & Taskbar CMS</h1>
          <p className="text-xs text-slate-400 mt-1">
            Control taskbar navigation links, enable or disable homepage sections, and customize layouts.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Preview Live Storefront</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* TASKBAR NAVIGATION OFFERS CONTROL COLUMN / CARD                          */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                navbarOffersEnabled
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border-rose-900'
              }`}
            >
              <Tag className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-bold text-white font-serif">Taskbar Offers Section</h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    navbarOffersEnabled
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border-rose-900'
                  }`}
                >
                  {navbarOffersEnabled ? 'ON (Visible in Taskbar)' : 'OFF (Hidden in Taskbar)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Turn ON or OFF the promotional <strong className="text-slate-200">&ldquo;OFFERS SALE&rdquo;</strong> item in the top navigation taskbar (desktop header, sticky scrolled bar, and mobile drawer).
              </p>
            </div>
          </div>

          {/* Single-Click Toggle Button */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <button
              type="button"
              disabled={togglingNavbarOffers}
              onClick={handleToggleNavbarOffers}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                navbarOffersEnabled
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-[#A84358] hover:bg-[#8C374A] text-white shadow-rose-900/20'
              }`}
            >
              {navbarOffersEnabled ? (
                <>
                  <EyeOff className="w-4 h-4 text-rose-400" />
                  <span>{togglingNavbarOffers ? 'Saving...' : 'Turn OFF in Taskbar'}</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>{togglingNavbarOffers ? 'Saving...' : 'Turn ON in Taskbar'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Status Summary */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                navbarOffersEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>
              Storefront Status:{' '}
              <strong className={navbarOffersEnabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {navbarOffersEnabled
                  ? 'Currently Live in Taskbar (Visible)'
                  : 'Currently Kept OFF (Hidden from Taskbar)'}
              </strong>
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Also keeps the homepage promotional offer banner synchronized
          </span>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Homepage Content Sections ({sections.length})
          </h3>
          <span className="text-xs text-slate-500">Reorder with arrows or toggle eye icon</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading sections...</div>
          ) : (
            sections.map((sec, idx) => (
              <div
                key={sec.id}
                className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  sec.active
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-slate-900/40 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{sec.title || sec.sectionType}</h4>
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded-sm border border-rose-900">
                        {sec.sectionType}
                      </span>
                      {sec.sectionType === 'BEST_SELLERS' && (
                        <Link
                          href="/admin/products"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-0.5 rounded-full transition-all ml-1"
                        >
                          <Flame className="w-3 h-3 fill-amber-400" />
                          <span>Manage Best Sellers & Deals →</span>
                        </Link>
                      )}
                      {sec.sectionType === 'OFFER_BANNER' && (
                        <Link
                          href="/admin/products"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 hover:text-white bg-rose-950/70 border border-rose-800/80 px-2.5 py-0.5 rounded-full transition-all ml-1"
                        >
                          <Tag className="w-3 h-3 text-rose-400" />
                          <span>Manage Product Deals →</span>
                        </Link>
                      )}
                      {sec.sectionType === 'REVIEWS' && (
                        <Link
                          href="/admin/reviews?tab=HOME_PAGE_SHOWCASE"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-0.5 rounded-full transition-all ml-1"
                        >
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>Select 6 Home Reviews →</span>
                        </Link>
                      )}
                    </div>
                    {sec.subtitle && (
                      <p className="text-xs text-slate-400 mt-0.5">{sec.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {/* Reorder Buttons */}
                  <button
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl disabled:opacity-30 transition-colors"
                    title="Move Up"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl disabled:opacity-30 transition-colors"
                    title="Move Down"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingSection(sec)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl transition-colors"
                    title="Edit Section Content"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Active Toggle */}
                  <button
                    onClick={() => handleToggleActive(sec)}
                    className={`p-2 rounded-xl transition-colors ${
                      sec.active
                        ? 'bg-rose-950 text-rose-400 hover:bg-rose-900 border border-rose-800'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={sec.active ? 'Disable Section' : 'Enable Section'}
                  >
                    {sec.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-serif">
              Edit Section: {editingSection.sectionType}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Section Heading</label>
                <input
                  type="text"
                  value={editingSection.title || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, title: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Section Subheading</label>
                <input
                  type="text"
                  value={editingSection.subtitle || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, subtitle: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Content Configuration (JSON)</label>
                <textarea
                  rows={6}
                  value={editingSection.contentJson || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, contentJson: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl font-bold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
