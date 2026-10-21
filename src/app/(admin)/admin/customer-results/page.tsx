'use client';

import ImageUploadField from '@/components/admin/ImageUploadField';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { normalizeImageUrl } from '@/lib/utils';

export default function AdminCustomerResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [beforeImage, setBeforeImage] = useState('');
  const [afterImage, setAfterImage] = useState('');
  const [caption, setCaption] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/admin/customer-results');
      const data = await res.json();
      if (data.results) setResults(data.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !afterImage.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/admin/customer-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          productTitle,
          beforeImage: beforeImage ? normalizeImageUrl(beforeImage) : null,
          afterImage: normalizeImageUrl(afterImage),
          caption,
        }),
      });

      if (res.ok) {
        setCustomerName('');
        setProductTitle('');
        setBeforeImage('');
        setAfterImage('');
        setCaption('');
        await fetchResults();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete transformation story?')) return;
    try {
      const res = await fetch('/api/admin/customer-results', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setResults(results.filter((r) => r.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-serif text-white">Before & After Transformations</h1>
        <p className="text-xs text-slate-400 mt-1">
          Add real customer hair transformation photo sets displayed on homepage and /results.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Add Transformation
          </h3>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Sneha Reddy (Hyderabad)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Product Used</label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="Herbic Cure - 21 Herbs Fusion Hair Oil"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploadField
                value={beforeImage}
                onChange={(url) => setBeforeImage(url)}
                label="Before Result Photo (Optional)"
                helperText="Upload customer before photo from device"
                placeholder="/images/banners/client-1.png"
              />
              <ImageUploadField
                value={afterImage}
                onChange={(url) => setAfterImage(url)}
                label="After Result Photo"
                helperText="Upload customer after photo from device"
                placeholder="/images/banners/client-2.png"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer Caption / Story</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe hair fall reduction timeline and regrowth results..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Saving...' : 'Add Result Story'}</span>
            </button>
          </form>
        </div>

        {/* Results List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Active Stories ({results.length})
          </h3>

          <div className="space-y-4">
            {results.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex gap-1 shrink-0">
                      {r.beforeImage && (
                        <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                          {(() => {
                            const bSrc = normalizeImageUrl(r.beforeImage);
                            return (
                              <Image
                                src={bSrc}
                                alt="Before"
                                fill
                                unoptimized={bSrc.includes('googleusercontent.com') || bSrc.includes('drive.google.com')}
                                sizes="56px"
                                className="object-cover"
                              />
                            );
                          })()}
                        </div>
                      )}
                      <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                        {(() => {
                          const aSrc = normalizeImageUrl(r.afterImage);
                          return (
                            <Image
                              src={aSrc}
                              alt="After"
                              fill
                              unoptimized={aSrc.includes('googleusercontent.com') || aSrc.includes('drive.google.com')}
                              sizes="56px"
                              className="object-cover"
                            />
                          );
                        })()}
                      </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs">{r.customerName}</h4>
                    <p className="text-[11px] text-rose-400 font-semibold">{r.productTitle}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                      &ldquo;{r.caption}&rdquo;
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700 shrink-0"
                  title="Delete result"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
