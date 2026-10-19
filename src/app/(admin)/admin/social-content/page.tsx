'use client';

import ImageUploadField from '@/components/admin/ImageUploadField';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Video, Plus, Trash2, Edit2, ExternalLink, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface SocialPost {
  id: string;
  thumbnailUrl: string;
  videoUrl?: string | null;
  instagramUrl?: string | null;
  caption?: string | null;
  productTitle?: string | null;
  displayOrder: number;
  active: boolean;
}

export default function AdminSocialContentPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/social-content');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch {
      toast.error('Failed to load social posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleStartEdit = (post: SocialPost) => {
    setEditingPostId(post.id);
    setThumbnailUrl(post.thumbnailUrl || '');
    setVideoUrl(post.videoUrl || '');
    setInstagramUrl(post.instagramUrl || '');
    setCaption(post.caption || '');
    setProductTitle(post.productTitle || '');
    setDisplayOrder(post.displayOrder || 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setThumbnailUrl('');
    setVideoUrl('');
    setInstagramUrl('');
    setCaption('');
    setProductTitle('');
    setDisplayOrder(posts.length + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thumbnailUrl.trim()) {
      toast.error('Thumbnail URL is required');
      return;
    }
    setSaving(true);

    try {
      if (editingPostId) {
        // Update existing
        const res = await fetch('/api/admin/social-content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPostId,
            thumbnailUrl: thumbnailUrl.trim(),
            videoUrl: videoUrl.trim() || null,
            instagramUrl: instagramUrl.trim() || 'https://www.instagram.com/herbiccure/',
            caption: caption.trim(),
            productTitle: productTitle.trim(),
            displayOrder: Number(displayOrder) || 1,
          }),
        });

        if (res.ok) {
          toast.success('Social post updated and homepage synced!');
          handleCancelEdit();
          await fetchPosts();
        } else {
          toast.error('Failed to update social post');
        }
      } else {
        // Create new
        const res = await fetch('/api/admin/social-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            thumbnailUrl: thumbnailUrl.trim(),
            videoUrl: videoUrl.trim() || null,
            instagramUrl: instagramUrl.trim() || 'https://www.instagram.com/herbiccure/',
            caption: caption.trim(),
            productTitle: productTitle.trim(),
            displayOrder: Number(displayOrder) || posts.length + 1,
          }),
        });

        if (res.ok) {
          toast.success('New social post created and homepage synced!');
          handleCancelEdit();
          await fetchPosts();
        } else {
          toast.error('Failed to create social post');
        }
      }
    } catch {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social reel card?')) return;
    try {
      const res = await fetch('/api/admin/social-content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success('Post removed from homepage');
        setPosts(posts.filter((p) => p.id !== id));
        if (editingPostId === id) handleCancelEdit();
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Network error while deleting');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold font-serif text-white">Instagram Reels / UGC</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage UGC video clips and Instagram reels featured in the homepage Reels section. Changes are live on the store immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create / Edit Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              {editingPostId ? (
                <>
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Edit Reel Card</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>Add New Reel / Post</span>
                </>
              )}
            </h3>
            {editingPostId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <ImageUploadField
              value={thumbnailUrl}
              onChange={(url) => setThumbnailUrl(url)}
              label="Reel / Video Thumbnail Cover"
              helperText="Upload reel preview thumbnail directly from device (vertical/square)"
              placeholder="/images/banners/client-1.png"
              aspectRatio="video"
              required
            />

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Featured Product / Tag
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="21 Herbs Fusion Hair Oil"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Caption / Description
              </label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Night oiling routine with 21 herbs infusion for deep root feeding ✨"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Instagram Reel / Video Link
              </label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Direct Video URL (Optional)
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://...mp4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {editingPostId ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{saving ? 'Updating...' : 'Update Reel Card'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-white" />
                  <span>{saving ? 'Saving...' : 'Add Reel Card'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Reels List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Social Video Cards ({posts.length})
            </h3>
            <span className="text-xs text-slate-400">
              Live in Home Page Reel Section
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading reels...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No reels created yet. Use the form to add your first reel card.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {posts.map((p) => {
                const isCurrentlyEditing = editingPostId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`bg-slate-800/60 rounded-2xl border overflow-hidden flex flex-col justify-between transition-all ${
                      isCurrentlyEditing
                        ? 'border-amber-400 ring-2 ring-amber-400/30'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="relative aspect-9/16 bg-slate-800">
                      <Image
                        src={p.thumbnailUrl}
                        alt={p.caption || 'Reel'}
                        fill
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-300 border border-white/20">
                        #{p.displayOrder}
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <span className="text-[10px] text-rose-400 font-bold block truncate">
                        {p.productTitle || 'Product'}
                      </span>
                      <p className="text-[11px] text-slate-300 line-clamp-2">
                        {p.caption}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-700/80">
                        <a
                          href={p.instagramUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
                        >
                          <span>Instagram</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(p)}
                            className="p-1.5 text-slate-300 hover:text-amber-300 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit this reel"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Delete this reel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
