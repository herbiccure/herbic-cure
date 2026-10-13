'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string | null;
  excerpt?: string | null;
  content: string;
  category: string;
  author: string;
  published: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

const CATEGORY_PRESETS = [
  'How to Use',
  'Ayurvedic Rituals',
  'Hair Science',
  'Kshirapak Method',
  'Ingredients & Herbs',
  'Hair Fall Remedies',
];

const IMAGE_PRESETS = [
  '/images/banners/banner-1.png',
  '/images/banners/banner-2.png',
  '/images/banners/banner-3.png',
];

export default function AdminBlogPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('How to Use');
  const [author, setAuthor] = useState('Herbic Cure Ayurvedic Team');
  const [published, setPublished] = useState(true);
  const [featuredImage, setFeaturedImage] = useState('/images/banners/banner-1.png');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/blog');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (e) {
      console.error('Failed to fetch blog posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategory('How to Use');
    setAuthor('Herbic Cure Ayurvedic Team');
    setPublished(true);
    setFeaturedImage('/images/banners/banner-1.png');
    setExcerpt('');
    setContent('');
  };

  const handleStartEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setTitle(post.title || '');
    setSlug(post.slug || '');
    setCategory(post.category || 'How to Use');
    setAuthor(post.author || 'Herbic Cure Ayurvedic Team');
    setPublished(post.published !== false);
    setFeaturedImage(post.featuredImage || '/images/banners/banner-1.png');
    setExcerpt(post.excerpt || '');
    setContent(post.content || '');

    setStatusMessage({
      type: 'success',
      text: `Editing "${post.title}". Make your changes and click "Update Article" below.`,
    });

    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    resetForm();
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusMessage({ type: 'error', text: 'Title and content are required.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const generatedSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    try {
      const payload: any = {
        title,
        slug: generatedSlug,
        category,
        author,
        published,
        featuredImage,
        excerpt,
        content,
      };

      if (editingId) {
        payload.id = editingId;
      }

      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: editingId
            ? 'Article updated successfully!'
            : 'New article published successfully!',
        });
        resetForm();
        await fetchPosts();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to save article.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Server error while saving article.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${postTitle}"?`)) return;

    try {
      const res = await fetch('/api/admin/blog', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        if (editingId === id) resetForm();
        setStatusMessage({ type: 'success', text: 'Article deleted successfully.' });
      } else {
        const data = await res.json();
        setStatusMessage({ type: 'error', text: data.error || 'Failed to delete article.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error connecting to server.' });
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-50 px-3.5 py-1 rounded-full mb-2 border border-rose-200">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Content & Education CMS</span>
          </div>
          <h1 className={`text-2xl font-bold font-serif ${isLight ? 'text-[#2D1B1B]' : 'text-white'}`}>
            How to Use & Blog Articles CMS
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#6E555C]' : 'text-slate-400'}`}>
            Publish, edit, and update step-by-step usage guides, Ayurvedic science, and Kshirapak hair care articles.
          </p>
        </div>

        {editingId && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 text-[#8C374A] border-rose-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#A84358]" />
            <span>Cancel Edit & Write New</span>
          </button>
        )}
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? isLight
                ? 'bg-rose-50 text-[#8C374A] border border-rose-200'
                : 'bg-rose-950/80 text-rose-200 border border-rose-800'
              : 'bg-red-950/80 text-red-200 border border-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-[#A84358] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Form Column */}
        <div
          ref={formRef}
          className={`lg:col-span-6 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 transition-all border ${
            editingId
              ? isLight
                ? 'bg-white border-[#A84358] ring-2 ring-[#A84358]/20'
                : 'bg-slate-900 border-[#A84358] ring-2 ring-[#A84358]/30'
              : isLight
              ? 'bg-white border-rose-100/90'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-rose-100' : 'border-slate-800'}`}>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A84358]">
                {editingId ? 'Editing Existing Article' : 'New Publication'}
              </span>
              <h3 className={`text-base font-bold mt-0.5 ${isLight ? 'text-[#2D1B1B]' : 'text-white'}`}>
                {editingId ? 'Edit Article Details' : 'Write New Article'}
              </h3>
            </div>
            {editingId && (
              <span className="bg-rose-100 text-[#8C374A] border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Edit Mode
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingId && !slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '')
                    );
                  }
                }}
                placeholder="e.g. How to Use 21 Herbs Hair Oil for Fast Root Regrowth"
                className={`w-full rounded-xl p-3 border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Slug & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="how-to-use-21-herbs-oil"
                  className={`w-full rounded-xl p-3 font-mono text-[11px] border focus:outline-hidden focus:border-[#A84358] ${
                    isLight
                      ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="How to Use"
                  className={`w-full rounded-xl p-3 border focus:outline-hidden focus:border-[#A84358] ${
                    isLight
                      ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Category Quick Presets */}
            <div>
              <span className={`block text-[11px] mb-1.5 font-medium ${isLight ? 'text-[#6E555C]' : 'text-slate-400'}`}>
                Quick Category Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors border ${
                      category === cat
                        ? 'bg-[#A84358] text-white border-[#A84358]'
                        : isLight
                        ? 'bg-rose-50 text-[#8C374A] border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Author & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                  Author Name
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Herbic Cure Ayurvedic Team"
                  className={`w-full rounded-xl p-3 border focus:outline-hidden focus:border-[#A84358] ${
                    isLight
                      ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-[#FCF8F9] border-rose-200/90' : 'bg-slate-800 border-slate-700'
              }`}>
                <div>
                  <span className={`block font-semibold text-xs ${isLight ? 'text-[#2D1B1B]' : 'text-white'}`}>
                    Publish Status
                  </span>
                  <span className={`text-[10px] ${isLight ? 'text-[#6E555C]' : 'text-slate-400'}`}>
                    {published ? 'Visible on website' : 'Hidden as draft'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPublished(!published)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    published ? 'bg-[#A84358]' : 'bg-stone-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Featured Image */}
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                Featured Banner Image URL
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="/images/banners/banner-1.png"
                className={`w-full rounded-xl p-3 font-mono text-[11px] border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
              <div className="flex gap-2 mt-2 items-center">
                <span className={`text-[10px] ${isLight ? 'text-[#6E555C]' : 'text-slate-400'}`}>Presets:</span>
                {IMAGE_PRESETS.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setFeaturedImage(img)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      featuredImage === img
                        ? 'bg-[#A84358] text-white border-[#A84358]'
                        : isLight
                        ? 'bg-rose-50 text-[#8C374A] border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Banner {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                Short Summary Excerpt
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary teaser shown on guide listing cards..."
                className={`w-full rounded-xl p-3 border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Content */}
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                Full Article Content (HTML / Text) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={8}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<h2>Application Steps</h2><p>Step-by-step instructions...</p>"
                className={`w-full rounded-xl p-3 font-mono text-[11px] border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`w-1/3 py-3 rounded-xl font-bold uppercase tracking-wider text-xs border transition-all ${
                    isLight
                      ? 'bg-rose-50 hover:bg-rose-100 text-[#8C374A] border-rose-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className={`py-3 bg-[#A84358] hover:bg-[#8C374A] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 ${
                  editingId ? 'w-2/3' : 'w-full'
                }`}
              >
                {editingId ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Updating...' : 'Update Article'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{submitting ? 'Publishing...' : 'Publish Article'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Article Listing Column */}
        <div
          className={`lg:col-span-6 rounded-3xl overflow-hidden p-6 sm:p-7 space-y-4 flex flex-col border shadow-sm ${
            isLight ? 'bg-white border-rose-100/90' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
            isLight ? 'border-rose-100' : 'border-slate-800'
          }`}>
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-[#2D1B1B]' : 'text-white'}`}>
                Posted Articles ({posts.length})
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-[#6E555C]' : 'text-slate-400'}`}>
                Click the <span className="text-[#A84358] font-bold">Edit pencil icon</span> on any card to update its content.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-stone-400' : 'text-slate-400'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* List items */}
          <div className="space-y-3.5 overflow-y-auto max-h-[720px] pr-1 flex-1">
            {loading ? (
              <div className="text-center py-12 text-stone-400 text-xs">Loading articles...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-xs">
                {searchQuery ? 'No articles match your search.' : 'No articles created yet.'}
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isSelected = editingId === post.id;
                return (
                  <div
                    key={post.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-[#FCF4F7] border-[#A84358] ring-2 ring-[#A84358]/20 shadow-xs'
                          : 'bg-rose-950/40 border-[#A84358] ring-1 ring-[#A84358]'
                        : isLight
                        ? 'bg-[#FCF8F9] border-rose-100/90 hover:border-rose-300 hover:bg-white shadow-2xs'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isLight
                              ? 'bg-rose-100 text-[#8C374A] border-rose-200'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}>
                            {post.category || 'How to Use'}
                          </span>
                          {post.published ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${
                              isLight
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            }`}>
                              Published
                            </span>
                          ) : (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${
                              isLight
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-amber-950/80 text-amber-400 border-amber-800'
                            }`}>
                              Draft
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] font-extrabold text-white bg-[#A84358] px-2 py-0.5 rounded-sm">
                              Currently Editing
                            </span>
                          )}
                        </div>

                        <h4 className={`font-bold text-xs sm:text-sm mt-1 leading-snug line-clamp-2 ${
                          isLight ? 'text-[#2D1B1B]' : 'text-white'
                        }`}>
                          {post.title}
                        </h4>

                        <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                          isLight ? 'text-[#6E555C]' : 'text-slate-400'
                        }`}>
                          {post.excerpt || (post.content ? post.content.substring(0, 100) + '...' : '')}
                        </p>

                        <div className={`flex items-center gap-3 text-[10px] pt-1 ${
                          isLight ? 'text-[#88727A]' : 'text-slate-400'
                        }`}>
                          <span className="font-mono">/{post.slug}</span>
                          <span>•</span>
                          <span>{post.author}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(post)}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border ${
                            isSelected
                              ? 'bg-[#A84358] text-white border-[#A84358] shadow-sm'
                              : isLight
                              ? 'bg-rose-100 text-[#8C374A] border-rose-200 hover:bg-[#A84358] hover:text-white hover:border-[#A84358]'
                              : 'bg-slate-700/80 text-slate-200 border-slate-600 hover:bg-[#A84358] hover:text-white'
                          }`}
                          title="Edit this article"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        {/* View in New Tab */}
                        <Link
                          href={`/hair-care-tips/${post.slug}`}
                          target="_blank"
                          className={`p-2 rounded-xl transition-colors ${
                            isLight
                              ? 'text-stone-500 hover:text-[#A84358] hover:bg-rose-100'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                          title="View live article"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id, post.title)}
                          className={`p-2 rounded-xl transition-colors ${
                            isLight
                              ? 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-red-400 hover:bg-red-950/60'
                          }`}
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
