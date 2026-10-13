'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Layers, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';

export default function AdminCollectionsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [banner, setBanner] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/admin/collections');
      const data = await res.json();
      if (data.collections) setCollections(data.collections);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: desc,
          bannerImage: banner || '/images/banners/banner-1.png',
        }),
      });

      if (res.ok) {
        setName('');
        setSlug('');
        setDesc('');
        setBanner('');
        await fetchCollections();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCollections(collections.filter((c) => c.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className={`text-2xl font-bold font-serif ${isLight ? 'text-[#2D1B1B]' : 'text-white'}`}>
          Collections
        </h1>
        <p className={`text-xs mt-1 ${isLight ? 'text-[#6E555C]' : 'text-slate-400'}`}>
          Manage product sets like Best Sellers, Combos & Kits, 21 Herbs Oils, and Accessories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Form */}
        <div
          className={`lg:col-span-5 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 border ${
            isLight ? 'bg-white border-rose-100/90' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-[#2D1B1B]' : 'text-white'}`}>
            Create Collection
          </h3>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                Collection Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                placeholder="e.g. Monsoon Hair Care"
                className={`w-full rounded-xl p-3 border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="monsoon-hair-care"
                className={`w-full rounded-xl p-3 font-mono text-[11px] border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                Description
              </label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Overview of this collection..."
                className={`w-full rounded-xl p-3 border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isLight ? 'text-[#2D1B1B]' : 'text-slate-300'}`}>
                Banner Image URL
              </label>
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="/images/banners/banner-1.png"
                className={`w-full rounded-xl p-3 font-mono text-xs border focus:outline-hidden focus:border-[#A84358] ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-200/90 text-[#2D1B1B] placeholder-stone-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-[#A84358] hover:bg-[#8C374A] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Creating...' : 'Create Collection'}</span>
            </button>
          </form>
        </div>

        {/* Collections List */}
        <div
          className={`lg:col-span-7 rounded-3xl overflow-hidden p-6 sm:p-7 space-y-4 border shadow-sm ${
            isLight ? 'bg-white border-rose-100/90' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <h3 className={`text-sm font-bold uppercase tracking-wider border-b pb-3 ${
            isLight ? 'text-[#2D1B1B] border-rose-100' : 'text-white border-slate-800'
          }`}>
            Active Collections ({collections.length})
          </h3>

          <div className="space-y-3.5">
            {collections.map((col) => (
              <div
                key={col.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isLight
                    ? 'bg-[#FCF8F9] border-rose-100/90 hover:border-rose-300 hover:bg-white shadow-2xs'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border ${
                    isLight ? 'bg-rose-50 border-rose-200/60' : 'bg-slate-800 border-slate-700'
                  }`}>
                    <Image
                      src={col.bannerImage || col.image || '/images/banners/banner-1.png'}
                      alt={col.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className={`font-bold text-xs sm:text-sm ${isLight ? 'text-[#2D1B1B]' : 'text-white'}`}>
                      {col.name}
                    </h4>
                    <span className={`text-[11px] font-mono ${isLight ? 'text-[#6E555C]' : 'text-slate-400'}`}>
                      /{col.slug}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full ml-2 border font-bold ${
                      isLight
                        ? 'bg-rose-100 text-[#8C374A] border-rose-200'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {col.products?.length || 0} products
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/collections/${col.slug}`}
                    target="_blank"
                    className={`p-2 rounded-xl transition-colors ${
                      isLight
                        ? 'text-stone-400 hover:text-[#A84358] hover:bg-rose-100'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title="View on site"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(col.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      isLight
                        ? 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                        : 'text-slate-400 hover:text-red-400 hover:bg-red-950/60'
                    }`}
                    title="Delete collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
