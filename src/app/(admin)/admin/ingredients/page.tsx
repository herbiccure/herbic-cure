'use client';

import React, { useState, useEffect } from 'react';
import { Leaf, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

export default function AdminIngredientsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [benefits, setBenefits] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/admin/ingredients');
      const data = await res.json();
      if (data.ingredients) setIngredients(data.ingredients);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const parsedBenefits = benefits.split(',').map((b) => b.trim()).filter(Boolean);
      const res = await fetch('/api/admin/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          shortDescription: desc,
          benefits: parsedBenefits,
        }),
      });

      if (res.ok) {
        setName('');
        setSlug('');
        setDesc('');
        setBenefits('');
        await fetchIngredients();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this herb?')) return;
    try {
      const res = await fetch('/api/admin/ingredients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setIngredients(ingredients.filter((i) => i.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <h1
          className={cn(
            'text-2xl font-bold font-serif',
            isLight ? 'text-slate-900' : 'text-white'
          )}
        >
          21 Ayurvedic Herbs
        </h1>
        <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
          Manage the botanical herbs database linked to product ingredient cards and the /ingredients encyclopedia.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Form */}
        <div
          className={cn(
            'lg:col-span-5 border p-6 rounded-3xl shadow-sm space-y-4',
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-900 border-slate-800 text-white'
          )}
        >
          <h3
            className={cn(
              'text-sm font-bold uppercase tracking-wider',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            Add Botanical Herb
          </h3>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label
                className={cn(
                  'block font-semibold mb-1',
                  isLight ? 'text-slate-700' : 'text-slate-300'
                )}
              >
                Herb Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                placeholder="e.g. Ashwagandha"
                className={cn(
                  'w-full border rounded-xl p-3 focus:outline-hidden focus:border-rose-500',
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <div>
              <label
                className={cn(
                  'block font-semibold mb-1',
                  isLight ? 'text-slate-700' : 'text-slate-300'
                )}
              >
                Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ashwagandha"
                className={cn(
                  'w-full border rounded-xl p-3 font-mono focus:outline-hidden focus:border-rose-500',
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <div>
              <label
                className={cn(
                  'block font-semibold mb-1',
                  isLight ? 'text-slate-700' : 'text-slate-300'
                )}
              >
                Botanical Action / Description
              </label>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ayurvedic pharmacology and hair follicle mechanism..."
                className={cn(
                  'w-full border rounded-xl p-3 focus:outline-hidden focus:border-rose-500',
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <div>
              <label
                className={cn(
                  'block font-semibold mb-1',
                  isLight ? 'text-slate-700' : 'text-slate-300'
                )}
              >
                Key Benefits (comma-separated)
              </label>
              <input
                type="text"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="Reduces shedding, Cortisol balance, Root strength"
                className={cn(
                  'w-full border rounded-xl p-3 focus:outline-hidden focus:border-rose-500',
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                    : 'bg-slate-800 border-slate-700 text-white'
                )}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-[#A84358] hover:bg-[#45363B] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Adding...' : 'Save Herb'}</span>
            </button>
          </form>
        </div>

        {/* Herbs List */}
        <div
          className={cn(
            'lg:col-span-7 border rounded-3xl overflow-hidden shadow-sm p-6 space-y-4',
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-900 border-slate-800 text-white'
          )}
        >
          <h3
            className={cn(
              'text-sm font-bold uppercase tracking-wider border-b pb-3',
              isLight ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white'
            )}
          >
            Botanical Directory ({ingredients.length} Herbs)
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {ingredients.map((ing) => (
              <div
                key={ing.id}
                className={cn(
                  'p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all',
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-800/60 border-slate-700 text-white'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl border flex items-center justify-center font-bold font-serif shrink-0',
                      isLight
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    )}
                  >
                    {ing.name[0]}
                  </div>
                  <div>
                    <h4 className={cn('font-bold text-xs', isLight ? 'text-slate-900' : 'text-white')}>
                      {ing.name}
                    </h4>
                    {ing.shortDescription && (
                      <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mt-0.5">
                        {ing.shortDescription}
                      </p>
                    )}
                    <p className={cn('text-[11px] mt-0.5 leading-relaxed', isLight ? 'text-slate-600' : 'text-slate-400')}>
                      {ing.fullDescription || ing.shortDescription}
                    </p>
                    {ing.benefits && (
                      <p className={cn('text-[10px] font-medium mt-1', isLight ? 'text-rose-800' : 'text-rose-400')}>
                        ✦ {ing.benefits}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(ing.id)}
                  className={cn(
                    'p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer',
                    isLight
                      ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                      : 'text-slate-400 hover:text-red-400 hover:bg-slate-700'
                  )}
                  title="Delete herb"
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
