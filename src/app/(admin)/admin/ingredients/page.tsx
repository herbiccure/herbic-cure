'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Leaf,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Check,
  X,
  Upload,
  RefreshCw,
  ExternalLink,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface HerbItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  benefits?: string | null;
  displayOrder: number;
  active: boolean;
}

export default function AdminIngredientsPage() {
  const [ingredients, setIngredients] = useState<HerbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<HerbItem>>({
    name: '',
    slug: '',
    image: '',
    shortDescription: '',
    fullDescription: '',
    benefits: '',
    displayOrder: 1,
    active: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ingredients');
      const data = await res.json();
      if (data.success && Array.isArray(data.ingredients)) {
        setIngredients(data.ingredients);
      }
    } catch (err) {
      toast.error('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleOpenCreate = () => {
    const nextOrder =
      ingredients.length > 0
        ? Math.max(...ingredients.map((i) => i.displayOrder || 0)) + 1
        : 1;

    setFormData({
      name: '',
      slug: '',
      image: '',
      shortDescription: '',
      fullDescription: '',
      benefits: '',
      displayOrder: nextOrder,
      active: true,
    });
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: HerbItem) => {
    setFormData({
      id: item.id,
      name: item.name,
      slug: item.slug,
      image: item.image || '',
      shortDescription: item.shortDescription || '',
      fullDescription: item.fullDescription || '',
      benefits: item.benefits || '',
      displayOrder: item.displayOrder,
      active: item.active,
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSaveHerb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Herb name is required');
      return;
    }

    try {
      setSaving(true);
      const url = '/api/admin/ingredients';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save herb');
      }

      toast.success(
        isEditing
          ? `Herb "${formData.name}" updated successfully`
          : `New herb "${formData.name}" added successfully`
      );
      setModalOpen(false);
      fetchIngredients();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: HerbItem) => {
    try {
      const nextActive = !item.active;
      const res = await fetch('/api/admin/ingredients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: nextActive }),
      });
      if (res.ok) {
        setIngredients((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, active: nextActive } : i))
        );
        toast.success(
          `${item.name} is now ${nextActive ? 'visible' : 'hidden'} on storefront`
        );
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteHerb = async (item: HerbItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/ingredients?id=${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setIngredients((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(`Herb "${item.name}" deleted successfully`);
      } else {
        toast.error('Failed to delete herb');
      }
    } catch {
      toast.error('Error deleting herb');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ingredients.length) return;

    const list = [...ingredients];
    const current = list[index];
    const target = list[targetIndex];

    const tempOrder = current.displayOrder;
    current.displayOrder = target.displayOrder;
    target.displayOrder = tempOrder;

    list[index] = target;
    list[targetIndex] = current;

    setIngredients(list);

    try {
      await fetch('/api/admin/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          items: [
            { id: current.id, displayOrder: current.displayOrder },
            { id: target.id, displayOrder: target.displayOrder },
          ],
        }),
      });
      toast.success('Order updated');
    } catch {
      toast.error('Failed to save order update');
      fetchIngredients();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('section', 'ingredients');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredIngredients = ingredients
    .filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.shortDescription &&
          item.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.benefits &&
          item.benefits.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? item.active
          : !item.active;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const activeCount = ingredients.filter((i) => i.active).length;
  const inactiveCount = ingredients.length - activeCount;

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#EAC9D1] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-rose-100 text-[#8C3A4F]">
              <Leaf className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C3A4F]">
              Botanical Formulation Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B1B] font-serif">
            21 Sacred Ayurvedic Herbs Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            Control the 21 medicinal herbs infused into Herbic Cure hair elixirs. Edit Sanskrit &amp; botanical subtitles, therapeutic actions, mechanism descriptions, and live storefront ordering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/ingredients"
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl border border-[#EAC9D1] text-[#8C3A4F] hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View /ingredients</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-rose-950/20 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Herb</span>
          </button>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#EAC9D1] shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Total Herbs in DB
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2D1B1B] font-sans">
              {ingredients.length}
            </span>
            <span className="text-xs font-bold text-[#8C3A4F]">
              {ingredients.length === 21 ? 'Complete (21 Sacred Herbs)' : 'Custom Count'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EAC9D1] shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Active on Storefront
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-sans">
              {activeCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600">Visible</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EAC9D1] shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Hidden / Inactive
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-400 font-sans">
              {inactiveCount}
            </span>
            <span className="text-xs text-stone-400">Off-air</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EAC9D1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Storefront Route
            </span>
            <span className="text-xs font-bold text-[#8C3A4F] mt-1 block">
              /ingredients
            </span>
          </div>
          <button
            type="button"
            onClick={fetchIngredients}
            className="p-2 text-stone-400 hover:text-[#8C3A4F] hover:bg-rose-50 rounded-xl transition-all"
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#EAC9D1] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by herb name, botanical subtitle, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D1B1B] outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#FCF8F9] p-1 rounded-xl border border-[#EAC9D1]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-[#8C3A4F] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All ({ingredients.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-stone-800 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Hidden ({inactiveCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl border transition-all ${
              viewMode === 'grid'
                ? 'bg-rose-50 text-[#8C3A4F] border-[#EAC9D1]'
                : 'text-stone-400 border-transparent hover:text-stone-700'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl border transition-all ${
              viewMode === 'table'
                ? 'bg-rose-50 text-[#8C3A4F] border-[#EAC9D1]'
                : 'text-stone-400 border-transparent hover:text-stone-700'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* INGREDIENTS LIST / GRID */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-[#EAC9D1] text-stone-400 text-xs">
          Loading 21 sacred botanicals...
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-[#EAC9D1] space-y-3">
          <Leaf className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No herbs found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your search query or add a new herb to the formulation.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#8C3A4F] text-white text-xs font-bold rounded-xl"
          >
            Add Herb
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredIngredients.map((herb, idx) => (
            <div
              key={herb.id}
              className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                herb.active
                  ? 'border-[#EAC9D1] hover:border-[#8C3A4F]/40'
                  : 'border-stone-200 opacity-60 bg-stone-50/50'
              }`}
            >
              <div>
                {/* Top strip: Order badge, active toggle, move buttons */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-[#8C3A4F] text-xs font-mono font-bold flex items-center justify-center border border-[#EAC9D1]">
                      #{herb.displayOrder || idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        herb.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      {herb.active ? 'Live' : 'Hidden'}
                    </span>
                  </div>

                  {/* Move Up / Down & Toggle */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredIngredients.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(herb)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ml-1 ${
                        herb.active
                          ? 'bg-rose-50 text-[#8C3A4F] hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {herb.active ? 'Hide' : 'Activate'}
                    </button>
                  </div>
                </div>

                {/* Herb Name & Icon / Image */}
                <div className="flex items-start gap-3 mb-2.5">
                  <div className="relative w-11 h-11 rounded-2xl bg-rose-100/70 text-[#8C3A4F] border border-rose-200/50 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {herb.image ? (
                      <Image
                        src={herb.image}
                        alt={herb.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Leaf className="w-5 h-5 text-[#8C3A4F]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D1B1B] leading-tight truncate">
                      {herb.name}
                    </h3>
                    {herb.shortDescription && (
                      <p className="text-[11px] font-bold text-[#8C3A4F] mt-0.5 line-clamp-1">
                        {herb.shortDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Full Description */}
                {herb.fullDescription && (
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-3">
                    {herb.fullDescription}
                  </p>
                )}
              </div>

              {/* Bottom: Action / Benefits and Buttons */}
              <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
                {herb.benefits && (
                  <div className="flex items-start gap-2 text-[11px] text-stone-700 bg-[#FCF8F9] p-2 rounded-xl border border-stone-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8C3A4F] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      <strong className="text-[#8C3A4F] mr-1">Action:</strong>
                      {herb.benefits}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(herb)}
                    className="flex-1 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-[#8C3A4F] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#EAC9D1]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Herb Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteHerb(herb)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Herb"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-[#EAC9D1] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCF8F9] text-stone-600 font-bold border-b border-[#EAC9D1] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4"># Order</th>
                  <th className="py-3 px-4">Herb Name &amp; Botanical Subtitle</th>
                  <th className="py-3 px-4">Key Action / Benefit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredIngredients.map((herb, idx) => (
                  <tr key={herb.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#8C3A4F]">
                      #{herb.displayOrder || idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-[#8C3A4F] flex items-center justify-center shrink-0">
                          <Leaf className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{herb.name}</div>
                          <div className="text-[10px] text-stone-500 font-medium">
                            {herb.shortDescription || herb.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-stone-600">
                      {herb.benefits || herb.fullDescription || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(herb)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          herb.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                        }`}
                      >
                        {herb.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(herb)}
                          className="p-1.5 text-stone-500 hover:text-[#8C3A4F] hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHerb(herb)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAC9D1] shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#EAC9D1] bg-[#FCF8F9] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C3A4F] block">
                  {isEditing ? 'Botanical Editor' : 'New Sacred Herb'}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#2D1B1B] font-serif">
                  {isEditing ? `Edit Herb: ${formData.name}` : 'Add New Ayurvedic Botanical'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveHerb} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Herb Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Herb Common Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug:
                          !prev.slug || prev.slug === ''
                            ? name
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '')
                            : prev.slug,
                      }));
                    }}
                    placeholder="e.g. Bhringraj"
                    className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white font-bold"
                  />
                </div>

                {/* URL Slug */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="e.g. bhringraj"
                    className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white font-mono"
                  />
                </div>

                {/* Botanical Subtitle */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Botanical / Sanskrit Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shortDescription: e.target.value,
                      }))
                    }
                    placeholder="e.g. Eclipta Alba - King of Herbs for Follicle Activation"
                    className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                  />
                </div>

                {/* Herb Image URL & Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Herb Photo / Illustration (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.image || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, image: e.target.value }))
                      }
                      placeholder="/images/herbs/bhringraj.jpg or https://..."
                      className="flex-1 px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white font-mono"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-[#8C3A4F] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Therapeutic Action / Key Benefits */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Key Action &amp; Hair Benefit Tag
                  </label>
                  <input
                    type="text"
                    value={formData.benefits || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        benefits: e.target.value,
                      }))
                    }
                    placeholder="e.g. Activates dormant hair follicles and reverses root thinning"
                    className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                  />
                </div>

                {/* Full Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Full Pharmacological / Ayurvedic Mechanism Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.fullDescription || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fullDescription: e.target.value,
                      }))
                    }
                    placeholder="Explain how this herb works inside the follicle, scalp micro-circulation, or DHT balancing..."
                    className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Display Order (1 to 21)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder ?? 1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayOrder: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white font-mono"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, active: !prev.active }))
                    }
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      formData.active ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        formData.active ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-stone-800">
                    {formData.active ? 'Visible on /ingredients' : 'Hidden from storefront'}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#EAC9D1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold transition-all shadow-md shadow-rose-950/20 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Herb Updates' : 'Add Herb to Formulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
