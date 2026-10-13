'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Save,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Eye,
  Check,
  RotateCcw,
  Palette,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';

const DEFAULT_LINES = [
  '♥ Experience the power of South India’s best natural Hair Oils',
  '🌿 Handcrafted with 21 Himalayan Herbs & Authentic Kshirapak Vidhi – 100% Pure & Toxin-Free',
  '🚚 Free Express Shipping & Cash on Delivery Available Across India on Orders Above ₹499',
];

const PRESET_BG_COLORS = [
  { name: 'Velvet Rose (Default)', hex: '#A84358' },
  { name: 'Royal Berry Wine', hex: '#6B2E3D' },
  { name: 'Dusty Rose Hero', hex: '#B0565F' },
  { name: 'Espresso Plum', hex: '#45363B' },
  { name: 'Dark Velvet Espresso', hex: '#2D1B1B' },
  { name: 'Warm Cedar Bark', hex: '#927469' },
];

const PRESET_TEXT_COLORS = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Silk Pearl Cream', hex: '#FCF8F9' },
  { name: 'Champagne Gold', hex: '#fef08a' },
  { name: 'Petal Rose Light', hex: '#F6DFE7' },
];

export default function AdminAnnouncementsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [announcements, setAnnouncements] = useState<string[]>(DEFAULT_LINES);
  const [enabled, setEnabled] = useState(true);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [mode, setMode] = useState<'running' | 'rotating'>('running');
  const [bg, setBg] = useState('#A84358');
  const [textColor, setTextColor] = useState('#ffffff');

  const [newLineText, setNewLineText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch settings from server
  useEffect(() => {
    fetch('/api/admin/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (data.announcements && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }
        if (typeof data.enabled === 'boolean') setEnabled(data.enabled);
        if (data.speed) setSpeed(data.speed);
        if (data.mode) setMode(data.mode);
        if (data.bg) setBg(data.bg);
        if (data.textColor) setTextColor(data.textColor);
      })
      .catch((err) => {
        console.error('Failed to load announcements:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAddLine = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newLineText.trim();
    if (!trimmed) return;
    setAnnouncements([...announcements, trimmed]);
    setNewLineText('');
  };

  const handleDeleteLine = (index: number) => {
    if (announcements.length <= 1) {
      alert('Please keep at least 1 announcement line.');
      return;
    }
    setAnnouncements(announcements.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= announcements.length) return;
    const copy = [...announcements];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setAnnouncements(copy);
    if (editingIndex !== null) setEditingIndex(null);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingText(announcements[index]);
  };

  const handleSaveEdit = (index: number) => {
    if (!editingText.trim()) return;
    const copy = [...announcements];
    copy[index] = editingText.trim();
    setAnnouncements(copy);
    setEditingIndex(null);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset announcement bar to recommended authentic Ayurvedic defaults?')) {
      setAnnouncements(DEFAULT_LINES);
      setEnabled(true);
      setSpeed('normal');
      setMode('running');
      setBg('#45363B');
      setTextColor('#ffffff');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcements,
          enabled,
          speed,
          mode,
          bg,
          textColor,
        }),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Announcement Bar published and updated live!' });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to save announcement bar settings.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'An unexpected error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const durationSec = speed === 'fast' ? '45s' : speed === 'slow' ? '95s' : '65s';
  const previewRepeat = Array(3).fill(announcements).flat();

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold font-serif ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Announcement Bar
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isLight
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              Live Ticker
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Manage the running text marquee displayed across the very top of your storefront.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md bg-[#A84358] hover:bg-[#45363B] text-white text-white-force disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Publishing...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border animate-fadeIn ${
            statusMessage.type === 'success'
              ? isLight
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : isLight
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-rose-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* LIVE PREVIEW BOX */}
      <div
        className={`rounded-3xl border p-5 shadow-xs overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-600" />
            <h2 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Live Storefront Preview
            </h2>
          </div>
          <span className="text-[11px]">
            {enabled ? (
              <span className={`font-semibold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                ● Active on storefront
              </span>
            ) : (
              <span className={`font-semibold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                ○ Disabled on storefront
              </span>
            )}
          </span>
        </div>

        {/* Real-time Ticker Preview Frame */}
        <div className="rounded-2xl overflow-hidden border border-black/10 shadow-inner">
          {enabled ? (
            <div
              style={{ backgroundColor: bg, color: textColor }}
              className="relative w-full overflow-hidden py-2 select-none"
            >
              {mode === 'running' ? (
                <div
                  className="flex w-max animate-marquee hover:[animation-play-state:paused]"
                  style={{ animationDuration: durationSec }}
                >
                  <div className="flex items-center shrink-0">
                    {previewRepeat.map((text, idx) => (
                      <div key={`p1-${idx}`} className="flex items-center shrink-0">
                        <span className="text-[11px] sm:text-xs font-semibold tracking-wider px-6 sm:px-8 inline-block whitespace-nowrap">
                          {text}
                        </span>
                        <span className="text-amber-400/90 text-xs shrink-0 select-none">✦</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center shrink-0">
                    {previewRepeat.map((text, idx) => (
                      <div key={`p2-${idx}`} className="flex items-center shrink-0">
                        <span className="text-[11px] sm:text-xs font-semibold tracking-wider px-6 sm:px-8 inline-block whitespace-nowrap">
                          {text}
                        </span>
                        <span className="text-amber-400/90 text-xs shrink-0 select-none">✦</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-0.5 text-xs font-semibold tracking-wide">
                  {announcements[0]}
                </div>
              )}
            </div>
          ) : (
            <div className={`py-4 text-center text-xs italic ${
              isLight ? 'bg-slate-100/80 text-slate-500' : 'bg-slate-800/50 text-slate-400'
            }`}>
              Announcement Bar is currently disabled. Toggle &apos;Enable Announcement Bar&apos; below to activate.
            </div>
          )}
        </div>
      </div>

      {/* 2-COLUMN CONFIGURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Announcement Lines */}
        <div
          className={`lg:col-span-7 rounded-3xl border p-6 space-y-5 shadow-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-rose-600" />
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Announcement Messages
              </h2>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
              isLight
                ? 'text-rose-800 bg-rose-50 border-rose-200'
                : 'text-rose-400 bg-rose-950/50 border-rose-800'
            }`}>
              {announcements.length} {announcements.length === 1 ? 'Message' : 'Messages'}
            </span>
          </div>

          {/* Add Message Input */}
          <form onSubmit={handleAddLine} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. ♥ Experience the power of South India's best natural Hair Oils"
              value={newLineText}
              onChange={(e) => setNewLineText(e.target.value)}
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs outline-none border transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-600'
                  : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500'
              }`}
            />
            <button
              type="submit"
              disabled={!newLineText.trim()}
              className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white text-white-force rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line</span>
            </button>
          </form>

          {/* Quick Suggestions Chips */}
          <div>
            <p className={`text-[11px] font-semibold mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Quick Ayurvedic suggestions to click &amp; add:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                '♥ Experience the power of South India’s best natural Hair Oils',
                '🌿 Handcrafted with 21 Himalayan Herbs & Authentic Kshirapak Vidhi',
                '🚚 Free Express Shipping & Cash on Delivery Available Across India',
                '💬 Instant Ayurvedic Expert Guidance on WhatsApp: +91 8121961219',
                '✨ Flat 10% Off on your first order with coupon code HERBIC10',
              ].map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    if (!announcements.includes(suggestion)) {
                      setAnnouncements([...announcements, suggestion]);
                    }
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left truncate max-w-full cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-900 border-slate-200 hover:border-rose-300 shadow-2xs'
                      : 'bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border-slate-700 hover:border-rose-700'
                  }`}
                  title={suggestion}
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Active Messages List */}
          <div className="space-y-2.5 pt-2">
            {announcements.map((line, index) => (
              <div
                key={index}
                className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                  isLight
                    ? 'bg-slate-50/80 hover:bg-slate-100/70 border-slate-200'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80'
                }`}
              >
                <div className="flex flex-col gap-1 pt-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className={`p-1 disabled:opacity-20 transition-colors cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-rose-700' : 'text-slate-500 hover:text-rose-400'
                    }`}
                    title="Move Up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === announcements.length - 1}
                    className={`p-1 disabled:opacity-20 transition-colors cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-rose-700' : 'text-slate-500 hover:text-rose-400'
                    }`}
                    title="Move Down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${
                          isLight
                            ? 'bg-white border-rose-600 text-slate-900'
                            : 'bg-slate-900 border-rose-500 text-white'
                        }`}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(index)}
                          className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white text-white-force rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className={`px-3 py-1 rounded-lg text-[11px] cursor-pointer ${
                            isLight
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p
                        className={`text-xs font-semibold leading-relaxed cursor-pointer ${
                          isLight ? 'text-slate-800 hover:text-rose-800' : 'text-slate-200 hover:text-rose-400'
                        }`}
                        onClick={() => handleStartEdit(index)}
                        title="Click to edit line"
                      >
                        {line}
                      </p>
                      <span className={`text-[10px] mt-0.5 inline-block ${
                        isLight ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Line #{index + 1} • Click text to edit
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteLine(index)}
                    className={`p-1.5 transition-colors cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-rose-600' : 'text-slate-500 hover:text-rose-400'
                    }`}
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Ticker Behavior & Colors */}
        <div
          className={`lg:col-span-5 rounded-3xl border p-6 space-y-6 shadow-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          {/* General Toggles */}
          <div className={`space-y-4 pb-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-600" />
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Ticker Display &amp; Speed
              </h2>
            </div>

            {/* Enable/Disable Toggle Card (Clean Light Style, No Black Box) */}
            <label className={`flex items-center justify-between cursor-pointer p-4 rounded-2xl border transition-all ${
              isLight
                ? 'bg-slate-50/90 hover:bg-slate-100/80 border-slate-200 text-slate-900 shadow-2xs'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-white'
            }`}>
              <div>
                <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Enable Announcement Bar
                </span>
                <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Show or hide this bar on all store pages
                </span>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
              />
            </label>

            {/* Display Mode */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Animation Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('running')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    mode === 'running'
                      ? isLight
                        ? 'admin-selection-btn-active border-rose-600 bg-rose-50 ring-2 ring-rose-600/30 shadow-xs'
                        : 'admin-selection-btn-active border-rose-500 bg-rose-950/60 ring-2 ring-rose-500/30'
                      : isLight
                      ? 'admin-selection-btn-inactive border-slate-200 bg-slate-50 hover:bg-slate-100'
                      : 'admin-selection-btn-inactive border-slate-700 bg-slate-800 hover:bg-slate-700'
                  }`}
                  style={{
                    color: mode === 'running' ? (isLight ? '#064e3b' : '#6ee7b7') : (isLight ? '#334155' : '#cbd5e1'),
                    backgroundColor: mode === 'running' ? (isLight ? '#ecfdf5' : 'rgba(6, 78, 59, 0.4)') : (isLight ? '#f8fafc' : '#1e293b'),
                    borderColor: mode === 'running' ? (isLight ? '#059669' : '#10b981') : (isLight ? '#e2e8f0' : '#334155'),
                  }}
                >
                  <span
                    className="block truncate font-bold text-xs"
                    style={{
                      color: mode === 'running' ? (isLight ? '#064e3b' : '#6ee7b7') : (isLight ? '#334155' : '#cbd5e1'),
                    }}
                  >
                    Running Marquee (Ticker)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('rotating')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    mode === 'rotating'
                      ? isLight
                        ? 'admin-selection-btn-active border-rose-600 bg-rose-50 ring-2 ring-rose-600/30 shadow-xs'
                        : 'admin-selection-btn-active border-rose-500 bg-rose-950/60 ring-2 ring-rose-500/30'
                      : isLight
                      ? 'admin-selection-btn-inactive border-slate-200 bg-slate-50 hover:bg-slate-100'
                      : 'admin-selection-btn-inactive border-slate-700 bg-slate-800 hover:bg-slate-700'
                  }`}
                  style={{
                    color: mode === 'rotating' ? (isLight ? '#064e3b' : '#6ee7b7') : (isLight ? '#334155' : '#cbd5e1'),
                    backgroundColor: mode === 'rotating' ? (isLight ? '#ecfdf5' : 'rgba(6, 78, 59, 0.4)') : (isLight ? '#f8fafc' : '#1e293b'),
                    borderColor: mode === 'rotating' ? (isLight ? '#059669' : '#10b981') : (isLight ? '#e2e8f0' : '#334155'),
                  }}
                >
                  <span
                    className="block truncate font-bold text-xs"
                    style={{
                      color: mode === 'rotating' ? (isLight ? '#064e3b' : '#6ee7b7') : (isLight ? '#334155' : '#cbd5e1'),
                    }}
                  >
                    Rotating Slide
                  </span>
                </button>
              </div>
            </div>

            {/* Speed Selection */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Marquee Running Speed
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'slow', label: 'Very Slow (95s)' },
                  { key: 'normal', label: 'Gentle (65s)' },
                  { key: 'fast', label: 'Brisk (45s)' },
                ].map((s) => {
                  const isSelected = speed === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSpeed(s.key as any)}
                      className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'admin-selection-btn-active border-rose-600 bg-rose-50 ring-2 ring-rose-600/30 shadow-xs'
                            : 'admin-selection-btn-active border-rose-500 bg-rose-950/60 ring-2 ring-rose-500/30'
                          : isLight
                          ? 'admin-selection-btn-inactive border-slate-200 bg-slate-50 hover:bg-slate-100'
                          : 'admin-selection-btn-inactive border-slate-700 bg-slate-800 hover:bg-slate-700'
                      }`}
                      style={{
                        color: isSelected ? (isLight ? '#064e3b' : '#6ee7b7') : (isLight ? '#334155' : '#cbd5e1'),
                        backgroundColor: isSelected ? (isLight ? '#ecfdf5' : 'rgba(6, 78, 59, 0.4)') : (isLight ? '#f8fafc' : '#1e293b'),
                        borderColor: isSelected ? (isLight ? '#059669' : '#10b981') : (isLight ? '#e2e8f0' : '#334155'),
                      }}
                    >
                      <span
                        className="block truncate font-bold text-[11px]"
                        style={{
                          color: isSelected ? (isLight ? '#064e3b' : '#6ee7b7') : (isLight ? '#334155' : '#cbd5e1'),
                        }}
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color Customization */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-rose-600" />
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Colors &amp; Theme
              </h2>
            </div>

            {/* Background Color */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Background Color
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_BG_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setBg(preset.hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                      bg === preset.hex ? 'border-amber-400 ring-2 ring-rose-500' : 'border-white/40 shadow-xs'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className={`w-8 h-8 rounded-lg cursor-pointer border p-0.5 ${
                    isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-800'
                  }`}
                />
                <input
                  type="text"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className={`flex-1 text-xs rounded-xl px-3 py-1.5 border uppercase font-mono ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Text Color
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_TEXT_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setTextColor(preset.hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                      textColor === preset.hex ? 'border-amber-400 ring-2 ring-rose-500' : 'border-slate-300 shadow-xs'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className={`w-8 h-8 rounded-lg cursor-pointer border p-0.5 ${
                    isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-800'
                  }`}
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className={`flex-1 text-xs rounded-xl px-3 py-1.5 border uppercase font-mono ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
