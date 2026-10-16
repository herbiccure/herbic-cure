'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  EyeOff,
  Search,
  X,
  Save,
  MessageCircleQuestion,
  Layers,
  Sparkles,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  placement: string;
  displayOrder: number;
  active: boolean;
}

export default function AdminFaqsPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const { data, isLoading, mutate } = useSWR<{ faqs: FAQItem[] }>(
    '/api/admin/faqs',
    fetcher
  );
  const faqs = data?.faqs ?? [];

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('Usage & Rituals');
  const [placement, setPlacement] = useState('HOMEPAGE');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    faqs.forEach((f) => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }, [faqs]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchesSearch =
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || f.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchQuery, selectedCategory]);

  const activeCount = faqs.filter((f) => f.active).length;

  const openCreateModal = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setCategory('Usage & Rituals');
    setPlacement('HOMEPAGE');
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (f: FAQItem) => {
    setEditingFaq(f);
    setQuestion(f.question);
    setAnswer(f.answer);
    setCategory(f.category || 'Usage & Rituals');
    setPlacement(f.placement || 'HOMEPAGE');
    setActive(Boolean(f.active));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error('Both question and answer are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingFaq) {
        // Update existing FAQ
        const res = await fetch('/api/admin/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingFaq.id,
            question,
            answer,
            category,
            placement,
            active,
          }),
        });

        if (!res.ok) throw new Error('Failed to update FAQ');
        toast.success('FAQ updated successfully!');
      } else {
        // Create new FAQ
        const res = await fetch('/api/admin/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            answer,
            category,
            placement,
            active,
            displayOrder: faqs.length + 1,
          }),
        });

        if (!res.ok) throw new Error('Failed to create FAQ');
        toast.success('New question added to FAQ database!');
      }

      setModalOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Error saving FAQ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (f: FAQItem) => {
    const nextVal = !f.active;
    // Optimistic update
    mutate(
      {
        faqs: faqs.map((it) => (it.id === f.id ? { ...it, active: nextVal } : it)),
      },
      false
    );

    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: f.id, active: nextVal }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      toast.success(nextVal ? 'Question is now live on storefront' : 'Question hidden from storefront');
    } catch {
      toast.error('Failed to update FAQ status');
      mutate();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteId }),
      });
      if (!res.ok) throw new Error('Failed to delete FAQ');
      toast.success('FAQ deleted successfully');
      mutate(
        { faqs: faqs.filter((f) => f.id !== deleteId) },
        false
      );
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting FAQ');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={cn(
              'text-2xl font-bold font-serif',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            FAQ Management &amp; Knowledge Base
          </h1>
          <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
            Manage frequently asked questions, customer answers, and live visibility on the website.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New FAQ</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          className={cn(
            'p-4 rounded-2xl border shadow-2xs',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Questions</span>
            <HelpCircle className="w-4 h-4 text-[#8C3A4F]" />
          </div>
          <div className={cn('text-xl sm:text-2xl font-extrabold', isLight ? 'text-slate-900' : 'text-white')}>
            {faqs.length}
          </div>
          <span className="text-[10px] text-slate-500">In FAQ database</span>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border shadow-2xs',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Live on Website</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
            {activeCount}
          </div>
          <span className="text-[10px] text-slate-500">Publicly visible</span>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border shadow-2xs',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Categories</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className={cn('text-xl sm:text-2xl font-extrabold', isLight ? 'text-slate-900' : 'text-white')}>
            {categories.length}
          </div>
          <span className="text-[10px] text-slate-500">Subject topics</span>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border shadow-2xs',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Hidden / Draft</span>
            <EyeOff className="w-4 h-4 text-slate-400" />
          </div>
          <div className={cn('text-xl sm:text-2xl font-extrabold', isLight ? 'text-slate-700' : 'text-slate-300')}>
            {faqs.length - activeCount}
          </div>
          <span className="text-[10px] text-slate-500">Draft questions</span>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div
        className={cn(
          'p-3.5 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between',
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        )}
      >
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords..."
            className={cn(
              'w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border outline-hidden transition-all',
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#8C3A4F]'
                : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#8C3A4F]'
            )}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              selectedCategory === 'ALL'
                ? 'bg-[#8C3A4F] text-white shadow-2xs'
                : isLight
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            All ({faqs.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                selectedCategory === cat
                  ? 'bg-[#8C3A4F] text-white shadow-2xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Cards List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-[#8C3A4F] border-t-transparent rounded-full animate-spin" />
          <span>Loading FAQ knowledge base...</span>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div
          className={cn(
            'p-12 text-center rounded-3xl border space-y-3',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-[#8C3A4F] flex items-center justify-center mx-auto">
            <MessageCircleQuestion className="w-6 h-6" />
          </div>
          <h3 className={cn('font-bold text-base', isLight ? 'text-slate-900' : 'text-white')}>
            No questions found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No FAQ questions matched your current search criteria.'
              : 'The FAQ database is currently empty. Add your first customer question above!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => (
            <div
              key={faq.id}
              className={cn(
                'p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
                isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
              )}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                      isLight
                        ? 'bg-rose-50 text-[#8C3A4F] border-rose-200'
                        : 'bg-rose-950/60 text-rose-400 border-rose-900'
                    )}
                  >
                    {faq.category || 'General'}
                  </span>
                  {faq.active ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Live</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      <EyeOff className="w-3 h-3 text-slate-400" />
                      <span>Hidden</span>
                    </span>
                  )}
                </div>

                <h3
                  className={cn(
                    'font-bold text-sm sm:text-base leading-snug',
                    isLight ? 'text-slate-900' : 'text-white'
                  )}
                >
                  {faq.question}
                </h3>

                <p
                  className={cn(
                    'text-xs leading-relaxed line-clamp-2',
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  )}
                >
                  {faq.answer}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleToggleActive(faq)}
                  className={cn(
                    'p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer',
                    faq.active
                      ? isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                  )}
                  title={faq.active ? 'Hide from live storefront' : 'Make live on storefront'}
                >
                  {faq.active ? <EyeOff className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(faq)}
                  className={cn(
                    'p-2 rounded-xl border transition-colors cursor-pointer',
                    isLight
                      ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  )}
                  title="Edit question & answer"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteId(faq.id)}
                  className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title="Delete FAQ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={cn(
              'rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border transition-colors max-h-[90vh] overflow-y-auto',
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            )}
          >
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-[#8C3A4F] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">
                    {editingFaq ? 'Edit Frequently Asked Question' : 'Add New Question'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingFaq ? 'Modify wording or category placement' : 'Create a new question for customers'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[11px] text-slate-700 dark:text-slate-300">
                  Question Text *
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. How often should I apply Herbic Cure 21 Herbs Fusion Hair Oil?"
                  className={cn(
                    'w-full p-2.5 text-xs rounded-xl border outline-hidden transition-colors',
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#8C3A4F]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                  )}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[11px] text-slate-700 dark:text-slate-300">
                  Detailed Answer *
                </label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Provide clear, authoritative Ayurvedic guidance for customers..."
                  className={cn(
                    'w-full p-2.5 text-xs rounded-xl border outline-hidden transition-colors',
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#8C3A4F]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-slate-700 dark:text-slate-300">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Usage & Rituals, Safety, Orders"
                    className={cn(
                      'w-full p-2.5 text-xs rounded-xl border outline-hidden transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-[#8C3A4F]'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[11px] text-slate-700 dark:text-slate-300">
                    Storefront Visibility
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-4 h-4 rounded text-[#8C3A4F] focus:ring-[#8C3A4F]"
                      />
                      <span className="font-semibold text-xs">
                        Publish live on website
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer',
                    isLight ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  )}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving...' : editingFaq ? 'Save Changes' : 'Create Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={cn(
              'rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border transition-colors',
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            )}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Delete this question?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This question will be permanently removed from the storefront FAQ knowledge base.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
