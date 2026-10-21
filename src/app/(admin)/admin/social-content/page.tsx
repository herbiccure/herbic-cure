'use client';

import ImageUploadField from '@/components/admin/ImageUploadField';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ReelPlayer, { parseVideoSource } from '@/components/ui/ReelPlayer';
import { Video, Plus, Trash2, Edit2, ExternalLink, Check, X, Upload, Loader2, Sparkles } from 'lucide-react';
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
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const videoSourceInfo = parseVideoSource(videoUrl);

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

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 60 * 1024 * 1024) {
      toast.error('Video file size exceeds 60MB limit');
      return;
    }

    setUploadingVideo(true);
    const toastId = toast.loading('Uploading video file...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setVideoUrl(data.url);
        toast.success('Video uploaded successfully!', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to upload video', { id: toastId });
      }
    } catch {
      toast.error('Network error while uploading video', { id: toastId });
    } finally {
      setUploadingVideo(false);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    }
  };

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
      let finalVideoUrl = videoUrl.trim() || null;
      const cleanIg = instagramUrl.trim();
      if (!finalVideoUrl && (cleanIg.includes('/reel/') || cleanIg.includes('/p/') || cleanIg.includes('drive.google.com') || cleanIg.includes('youtube.com') || cleanIg.includes('youtu.be'))) {
        finalVideoUrl = cleanIg;
      }

      if (editingPostId) {
        // Update existing
        const res = await fetch('/api/admin/social-content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPostId,
            thumbnailUrl: thumbnailUrl.trim(),
            videoUrl: finalVideoUrl,
            instagramUrl: cleanIg || 'https://www.instagram.com/herbiccure/',
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
            videoUrl: finalVideoUrl,
            instagramUrl: cleanIg || 'https://www.instagram.com/herbiccure/',
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
          Manage UGC video clips and Instagram reels featured in the homepage Reels section. Videos autoplay smoothly in the storefront.
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

            {/* Video Upload & URL Input */}
            <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reel Video (File Upload or Link)</span>
                </label>
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Clear Video
                  </button>
                )}
              </div>

              {/* Direct File Upload Button */}
              <div className="flex items-center gap-2">
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/ogg"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingVideo}
                  onClick={() => videoFileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-[11px]"
                >
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      <span>Uploading Video...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-rose-400" />
                      <span>Upload Video (.mp4, .webm, up to 60MB)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Or paste: Google Drive link, YouTube Shorts, or .mp4 URL"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-[11px] focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Format Detection Badge */}
              {videoSourceInfo && (
                <div className="flex items-center gap-1.5 text-[10px] py-1 px-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {videoSourceInfo.type === 'gdrive' && 'Google Drive Link Detected (Direct Stream & Preview)'}
                    {videoSourceInfo.type === 'youtube' && 'YouTube / Shorts Link Detected (Plays via ReactPlayer)'}
                    {videoSourceInfo.type === 'instagram' && 'Instagram Reel Detected (Embed player ready)'}
                    {videoSourceInfo.type === 'vimeo' && 'Vimeo Link Detected'}
                    {videoSourceInfo.type === 'direct' && 'Direct Video Stream Detected (HTML5 Autoplay)'}
                  </span>
                </div>
              )}

              {/* Live Video Preview in Admin */}
              {videoUrl && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Live Storefront Preview:</span>
                  <div className="relative aspect-9/14 w-32 mx-auto rounded-xl overflow-hidden bg-black border border-slate-700 shadow-md">
                    <ReelPlayer
                      url={videoUrl}
                      thumbnailUrl={thumbnailUrl}
                      playing={true}
                      muted={true}
                      controls={false}
                      loop={true}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

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
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Night oiling routine with 21 herbs infusion for deep root feeding ✨"
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
                  Instagram Link
                </label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || uploadingVideo}
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
                      {p.videoUrl && (
                        <div className="absolute top-2 right-2 bg-rose-950/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-rose-300 border border-rose-800/40 flex items-center gap-1">
                          <Video className="w-2.5 h-2.5" />
                          <span>Video</span>
                        </div>
                      )}
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
