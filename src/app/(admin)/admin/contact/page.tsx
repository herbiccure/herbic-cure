'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Save,
  MessageSquare,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useAdminTheme } from '@/components/admin/AdminThemeProvider';
import { cn } from '@/lib/utils';

interface ContactSettings {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  pageTitle: string;
  pageSubtitle: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminContactPage() {
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'INQUIRIES'>('SETTINGS');

  // Contact Info Settings
  const { data: settingsData, mutate: mutateSettings, isLoading: settingsLoading } = useSWR<ContactSettings>(
    '/api/admin/contact-settings',
    fetcher
  );

  // Inquiries Submissions
  const { data: submissionsData, mutate: mutateInquiries, isLoading: inquiriesLoading } = useSWR<{
    submissions: Inquiry[];
  }>('/api/admin/contact-submissions', fetcher);

  const inquiries = submissionsData?.submissions ?? [];

  const [form, setForm] = useState<ContactSettings>({
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    hours: '',
    pageTitle: '',
    pageSubtitle: '',
  });

  const [saving, setSaving] = useState(false);
  const [inquirySearch, setInquirySearch] = useState('');

  useEffect(() => {
    if (settingsData) {
      setForm(settingsData);
    }
  }, [settingsData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/contact-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save settings');
      }

      toast.success('Contact Us page information updated successfully!');
      mutateSettings();
    } catch (err: any) {
      toast.error(err.message || 'Error saving contact information');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/contact-submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update inquiry status');
      toast.success(`Inquiry marked as ${newStatus}`);
      mutateInquiries();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (!inquirySearch.trim()) return true;
    const q = inquirySearch.toLowerCase();
    return (
      inq.name.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      (inq.phone && inq.phone.toLowerCase().includes(q)) ||
      inq.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={cn(
              'text-2xl font-bold font-serif',
              isLight ? 'text-slate-900' : 'text-white'
            )}
          >
            Contact Us Page CMS &amp; Inquiries
          </h1>
          <p
            className={cn(
              'text-xs mt-1',
              isLight ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Manage public contact details (WhatsApp, support email, headquarters) and view customer hair inquiries.
          </p>
        </div>

        <a
          href="/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#8C3A4F] bg-[#FCF4F7] border border-[#EAC9D1] hover:bg-[#F6DFE7] transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>View Live Contact Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EAC9D1]/70 gap-2 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={cn(
            'pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer',
            activeTab === 'SETTINGS'
              ? 'border-[#8C3A4F] text-[#8C3A4F]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Contact Page Details &amp; Helpline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INQUIRIES')}
          className={cn(
            'pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer',
            activeTab === 'INQUIRIES'
              ? 'border-[#8C3A4F] text-[#8C3A4F]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          )}
        >
          <Inbox className="w-4 h-4" />
          <span>Customer Inquiries ({inquiries.length})</span>
        </button>
      </div>

      {activeTab === 'SETTINGS' ? (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Hero Banner Titles */}
          <div
            className={cn(
              'p-6 rounded-3xl border shadow-xs space-y-4',
              isLight ? 'bg-white border-[#EAC9D1]' : 'bg-slate-900 border-slate-800'
            )}
          >
            <h3 className={cn('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>
              Page Header &amp; Subtitle
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Page Title (H1)
                </label>
                <input
                  type="text"
                  value={form.pageTitle}
                  onChange={(e) => setForm({ ...form, pageTitle: e.target.value })}
                  placeholder="e.g. We're Here To Support Your Hair Journey"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition-colors font-medium',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Page Subtitle / Description
                </label>
                <textarea
                  rows={2}
                  value={form.pageSubtitle}
                  onChange={(e) => setForm({ ...form, pageSubtitle: e.target.value })}
                  placeholder="e.g. Have questions about an order or need personalized Ayurvedic advice? Reach out below."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-xs outline-none resize-none transition-colors leading-relaxed',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div
            className={cn(
              'p-6 rounded-3xl border shadow-xs space-y-5',
              isLight ? 'bg-white border-[#EAC9D1]' : 'bg-slate-900 border-slate-800'
            )}
          >
            <h3 className={cn('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>
              Storefront Helpline &amp; Channels
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Support Number (With Country Code, e.g. 918121961219)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="918121961219"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Display Phone Helpline (e.g. +91 8121961219)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#8C3A4F]" />
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 8121961219"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Support Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#8C3A4F]" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="care@herbiccure.com"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Working Hours / Operational Schedule
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3 w-4 h-4 text-[#8C3A4F]" />
                  <input
                    type="text"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="Mon - Sat: 9:00 AM - 7:00 PM IST"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-colors',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Headquarters &amp; Physical Office Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-[#8C3A4F]" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Herbic Cure Ayurvedic Naturals, Plot 45, Jubilee Enclave, HITEC City, Hyderabad, Telangana 500081"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-colors leading-relaxed',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#8C3A4F] focus:bg-white'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-[#8C3A4F]'
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Contact Details...' : 'Save Contact Us Settings'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Inquiries Tab */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                placeholder="Search inquiries by name, email, query..."
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-xl border text-xs outline-none',
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => mutateInquiries()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Inquiries</span>
            </button>
          </div>

          {filteredInquiries.length === 0 ? (
            <div
              className={cn(
                'p-12 text-center rounded-3xl border',
                isLight ? 'bg-white border-[#EAC9D1]' : 'bg-slate-900 border-slate-800'
              )}
            >
              <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className={cn('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>
                No Customer Inquiries Found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                New contact inquiries submitted on the storefront will appear here.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'rounded-3xl border overflow-hidden shadow-xs divide-y',
                isLight ? 'bg-white border-[#EAC9D1] divide-slate-100' : 'bg-slate-900 border-slate-800 divide-slate-800'
              )}
            >
              {filteredInquiries.map((inq) => (
                <div key={inq.id} className="p-5 sm:p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#8C3A4F] flex items-center justify-center font-bold text-xs shrink-0">
                        {inq.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className={cn('text-xs font-bold', isLight ? 'text-slate-900' : 'text-white')}>
                          {inq.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <a href={`mailto:${inq.email}`} className="hover:underline text-[#8C3A4F]">
                            {inq.email}
                          </a>
                          {inq.phone && (
                            <>
                              <span>•</span>
                              <a href={`tel:${inq.phone}`} className="hover:underline">
                                {inq.phone}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[10px] text-slate-400">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateInquiryStatus(inq.id, inq.status === 'RESOLVED' ? 'NEW' : 'RESOLVED')
                        }
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer',
                          inq.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        )}
                      >
                        {inq.status === 'RESOLVED' ? 'Resolved' : 'Pending / New'}
                      </button>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'p-4 rounded-2xl text-xs leading-relaxed',
                      isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-800/60 text-slate-300'
                    )}
                  >
                    {inq.message}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`mailto:${inq.email}?subject=Reply from Herbic Cure: ${encodeURIComponent(inq.subject || 'Your Inquiry')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8C3A4F] text-white text-[11px] font-bold hover:bg-[#722E3F] transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Reply via Email</span>
                    </a>
                    {inq.phone && (
                      <a
                        href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${inq.name}, we received your message regarding Herbic Cure Ayurvedic formulations.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-bold hover:bg-emerald-800 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
