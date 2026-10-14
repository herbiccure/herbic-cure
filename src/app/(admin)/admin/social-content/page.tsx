'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Video, Plus, Trash2, ExternalLink } from 'lucide-react';

export default function AdminSocialContentPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/social-content');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thumbnailUrl.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/admin/social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thumbnailUrl,
          instagramUrl: instagramUrl || 'https://www.instagram.com/herbiccure/',
          caption,
          productTitle,
        }),
      });

      if (res.ok) {
        setThumbnailUrl('');
        setInstagramUrl('');
        setCaption('');
        setProductTitle('');
        await fetchPosts();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this social post?')) return;
    try {
      const res = await fetch('/api/admin/social-content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-serif text-white">Instagram Reels / UGC</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage UGC video clips and Instagram reels featured on the homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Add New Reel / Post
          </h3>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Thumbnail Image URL *</label>
              <input
                type="text"
                required
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="/images/banners/client-1.png"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Instagram Post / Reel URL</label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Featured Product</label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="Herbic Cure - 21 Herbs Fusion Hair Oil"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Caption / Hashtags</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Night oiling routine with 21 herbs ✨ #HerbicCureRegrowth"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">{creating ? 'Saving...' : 'Add Video Card'}</span>
            </button>
          </form>
        </div>

        {/* Reels List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Active Social Video Cards ({posts.length})
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {posts.map((p) => (
              <div
                key={p.id}
                className="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-9/16 bg-slate-800">
                  <Image src={p.thumbnailUrl} alt="Reel" fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
                </div>
                <div className="p-3 space-y-2">
                  <span className="text-[10px] text-rose-400 font-bold block truncate">
                    {p.productTitle || 'Product'}
                  </span>
                  <p className="text-[11px] text-slate-300 line-clamp-2">{p.caption}</p>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-700">
                    <a
                      href={p.instagramUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
                    >
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
