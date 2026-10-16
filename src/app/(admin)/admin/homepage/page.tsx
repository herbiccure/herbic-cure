'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Edit3,
  ExternalLink,
  Save,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Tag,
  Star,
  Flame,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  AlertCircle,
  HelpCircle,
  Video,
  ShieldCheck,
  Package,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

interface Slide {
  desktopImage: string;
  mobileImage?: string;
  badge?: string;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

const SECTION_PRESETS = [
  {
    type: 'HERO_SLIDER',
    title: 'Hero Banner Slider',
    subtitle: 'High-impact full-width image slides with CTAs',
    icon: Sparkles,
    defaultTitle: 'Hero Banner Slider',
    defaultSubtitle: 'Discover Authentic Ayurvedic Hair Rituals',
  },
  {
    type: 'BEST_SELLERS',
    title: 'Best Sellers Carousel',
    subtitle: 'Showcase high-converting top rated products',
    icon: Flame,
    defaultTitle: 'Best Selling Hair Rituals',
    defaultSubtitle: 'Handcrafted with 21 potent herbs for visible restoration',
  },
  {
    type: 'CATEGORIES',
    title: 'Categories Visual Grid',
    subtitle: 'Browse by category with quick links',
    icon: Layers,
    defaultTitle: 'Explore Ayurvedic Categories',
    defaultSubtitle: 'Targeted wellness collections for every hair need',
  },
  {
    type: 'FEATURED_PRODUCTS',
    title: 'Featured Collection',
    subtitle: 'Highlight seasonal offers and curated formulas',
    icon: Star,
    defaultTitle: 'Featured Formulations',
    defaultSubtitle: 'Pure botanical infusions crafted according to ancient texts',
  },
  {
    type: 'DISCOVER',
    title: 'Brand Story & Philosophy',
    subtitle: 'Discover Herbicas authenticity section',
    icon: BookOpen,
    defaultTitle: 'Discover Herbicas',
    defaultSubtitle: 'Rooted in Kshirapak Vidhi and nature purity',
  },
  {
    type: 'RESULTS',
    title: 'Clinical Results & Before/After',
    subtitle: 'Real customer hair transformation proof',
    icon: ShieldCheck,
    defaultTitle: 'Real People. Real Results.',
    defaultSubtitle: 'Clinically proven visible reduction in hair thinning',
  },
  {
    type: 'REELS',
    title: 'Social Video Reels',
    subtitle: 'Instagram video feed and creator unboxings',
    icon: Video,
    defaultTitle: 'Trending on Social',
    defaultSubtitle: 'Watch genuine creator hair journeys and unboxings',
  },
  {
    type: 'WHY_US',
    title: '4-Pillar Trust Guarantees',
    subtitle: 'Ayurvedic certification, free delivery, zero toxins',
    icon: CheckCircle2,
    defaultTitle: 'The Herbic Cure Promise',
    defaultSubtitle: 'Clean, transparent, authentic ayurveda guaranteed',
  },
  {
    type: 'REVIEWS',
    title: 'Verified Customer Testimonials',
    subtitle: 'Curated 5-star customer ratings and reviews',
    icon: Star,
    defaultTitle: 'Loved by Over 50,000+ Customers',
    defaultSubtitle: 'Verified feedback from genuine daily users',
  },
  {
    type: 'FAQ',
    title: 'Frequently Asked Questions',
    subtitle: 'Instant answers to common customer questions',
    icon: HelpCircle,
    defaultTitle: 'Frequently Asked Questions',
    defaultSubtitle: 'Everything you need to know about our oils and rituals',
  },
  {
    type: 'OFFER_BANNER',
    title: 'Flash Sale & Countdown Banner',
    subtitle: 'Limited-time promotional discount banner',
    icon: Tag,
    defaultTitle: 'Limited Time Seasonal Offer',
    defaultSubtitle: 'Save up to 33% on hair therapy combos today',
  },
];

export default function AdminHomepageBuilderPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Taskbar Offers section toggle state (defaults to false / OFF)
  const [navbarOffersEnabled, setNavbarOffersEnabled] = useState(false);
  const [togglingNavbarOffers, setTogglingNavbarOffers] = useState(false);

  // Section Editing Modal
  const [editingSection, setEditingSection] = useState<any | null>(null);

  // Hero Slider Visual Editor State
  const [heroSlides, setHeroSlides] = useState<Slide[]>([]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // Add New Section Modal
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('HERO_SLIDER');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/admin/homepage');
      const data = await res.json();
      if (data.sections) setSections(data.sections);
      if (typeof data.navbarOffersEnabled === 'boolean') {
        setNavbarOffersEnabled(data.navbarOffersEnabled);
      }
    } catch {
      toast.error('Failed to load homepage sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // When opening a section for edit, parse its slides if it is a hero section
  const handleOpenEdit = (sec: any) => {
    setEditingSection({ ...sec });
    if (sec.sectionType === 'HERO' || sec.sectionType === 'HERO_SLIDER') {
      try {
        const parsed = JSON.parse(sec.contentJson || '{}');
        if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          setHeroSlides(parsed.slides);
        } else {
          setHeroSlides([
            {
              desktopImage: '/images/banners/herbic-hero-banner-1.jpg',
              mobileImage: '/images/banners/herbic-hero-banner-1.jpg',
              badge: 'Authentic Ayurvedic Kshirapak Vidhi',
              heading: 'Herbic Cure - 21 Herbs Fusion Hair Oil',
              subheading:
                'Ancient Ayurveda for Modern Strength. Nature In Every Drop: 100% Herbal infusion of 21 roots and botanical extracts.',
              ctaText: 'SHOP INTRODUCTORY OFFER',
              ctaUrl: '/collections/all',
              secondaryCtaText: 'VIEW 21 HERBS',
              secondaryCtaUrl: '/ingredients',
            },
          ]);
        }
      } catch {
        setHeroSlides([]);
      }
      setSelectedSlideIndex(0);
    }
  };

  const handleToggleNavbarOffers = async () => {
    const nextVal = !navbarOffersEnabled;
    setTogglingNavbarOffers(true);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          navbarOffersEnabled: nextVal,
          syncOfferBanner: true,
        }),
      });
      if (res.ok) {
        setNavbarOffersEnabled(nextVal);
        setSections((prev) =>
          prev.map((s) => (s.sectionType === 'OFFER_BANNER' ? { ...s, active: nextVal } : s))
        );
        toast.success(
          nextVal
            ? 'Offers section TURNED ON in taskbar and homepage'
            : 'Offers section TURNED OFF in taskbar and homepage'
        );
      } else {
        toast.error('Failed to update taskbar setting');
      }
    } catch {
      toast.error('Network error updating taskbar setting');
    } finally {
      setTogglingNavbarOffers(false);
    }
  };

  const handleToggleActive = async (s: any) => {
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, active: !s.active }),
      });
      if (res.ok) {
        setSections(sections.map((item) => (item.id === s.id ? { ...item, active: !s.active } : item)));
        toast.success(`Section ${!s.active ? 'enabled' : 'disabled'}`);
      }
    } catch {
      toast.error('Failed to toggle section');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    setSections(copy);

    try {
      const reorderedIds = copy.map((s) => s.id);
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: reorderedIds }),
      });
      if (!res.ok) throw new Error('Failed to save order');
      toast.success(`Moved "${temp.title || temp.sectionType}" ${direction}`);
    } catch {
      toast.error('Failed to save new section order');
      fetchSections();
    }
  };

  const handleDeleteSection = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the homepage?`)) return;
    try {
      const res = await fetch(`/api/admin/homepage?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSections(sections.filter((s) => s.id !== id));
        toast.success(`Deleted section "${name}"`);
      } else {
        toast.error('Failed to delete section');
      }
    } catch {
      toast.error('Network error deleting section');
    }
  };

  // -------------------------------------------------------------
  // HERO SLIDER MANAGEMENT FUNCTIONS
  // -------------------------------------------------------------
  const handleAddSlide = () => {
    const newSlide: Slide = {
      desktopImage: '/images/banners/herbic-hero-banner-1.jpg',
      mobileImage: '/images/banners/herbic-hero-banner-1.jpg',
      badge: 'Authentic Ayurvedic Kshirapak Vidhi',
      heading: 'New Ayurvedic Hair Treatment',
      subheading: 'Infused with cold-pressed natural herbs to nourish roots and promote healthy growth.',
      ctaText: 'EXPLORE COLLECTION',
      ctaUrl: '/collections/all',
      secondaryCtaText: 'ORDER ON WHATSAPP',
      secondaryCtaUrl: 'https://wa.me/918121961219',
    };
    const updated = [...heroSlides, newSlide];
    setHeroSlides(updated);
    setSelectedSlideIndex(updated.length - 1);
    toast.success('New slide added. Remember to click "Save All Changes".');
  };

  const handleDeleteSlide = (index: number) => {
    if (heroSlides.length <= 1) {
      toast.error('The hero banner must have at least one slide.');
      return;
    }
    const updated = heroSlides.filter((_, i) => i !== index);
    setHeroSlides(updated);
    setSelectedSlideIndex(Math.max(0, index - 1));
    toast.success('Slide removed');
  };

  const handleMoveSlide = (index: number, direction: 'prev' | 'next') => {
    const target = direction === 'prev' ? index - 1 : index + 1;
    if (target < 0 || target >= heroSlides.length) return;
    const copy = [...heroSlides];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setHeroSlides(copy);
    setSelectedSlideIndex(target);
  };

  const handleUpdateCurrentSlide = (field: keyof Slide, value: string) => {
    const copy = [...heroSlides];
    copy[selectedSlideIndex] = {
      ...copy[selectedSlideIndex],
      [field]: value,
    };
    setHeroSlides(copy);
  };

  const handleImageFileUpload = async (file: File, isMobile: boolean = false) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (isMobile) {
          handleUpdateCurrentSlide('mobileImage', data.url);
          toast.success('Mobile image uploaded successfully!');
        } else {
          handleUpdateCurrentSlide('desktopImage', data.url);
          // Auto-set mobile if not set yet
          if (!heroSlides[selectedSlideIndex]?.mobileImage) {
            handleUpdateCurrentSlide('mobileImage', data.url);
          }
          toast.success('Banner image uploaded successfully!');
        }
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch {
      toast.error('Network error during image upload');
    } finally {
      setUploadingImage(false);
    }
  };

  // -------------------------------------------------------------
  // SAVE EDITED SECTION
  // -------------------------------------------------------------
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    setSaving(true);

    let finalContentJson = editingSection.contentJson;

    // If it's the hero section, serialize our visual slide state
    if (editingSection.sectionType === 'HERO' || editingSection.sectionType === 'HERO_SLIDER') {
      finalContentJson = JSON.stringify({ slides: heroSlides }, null, 2);
    }

    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSection.id,
          title: editingSection.title,
          subtitle: editingSection.subtitle,
          contentJson: finalContentJson,
        }),
      });
      if (res.ok) {
        await fetchSections();
        setEditingSection(null);
        toast.success('Homepage section saved successfully!');
      } else {
        toast.error('Failed to save section changes');
      }
    } catch {
      toast.error('Network error saving section');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // CREATE NEW SECTION
  // -------------------------------------------------------------
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSection(true);
    const preset = SECTION_PRESETS.find((p) => p.type === selectedPreset);

    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: selectedPreset,
          title: newSectionTitle || preset?.defaultTitle || selectedPreset,
          subtitle: newSectionSubtitle || preset?.defaultSubtitle || null,
        }),
      });

      if (res.ok) {
        await fetchSections();
        setIsAddSectionOpen(false);
        setNewSectionTitle('');
        setNewSectionSubtitle('');
        toast.success(`Added new "${preset?.title || selectedPreset}" section to homepage!`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create section');
      }
    } catch {
      toast.error('Network error creating section');
    } finally {
      setAddingSection(false);
    }
  };

  const isHeroSection =
    editingSection?.sectionType === 'HERO' || editingSection?.sectionType === 'HERO_SLIDER';

  const currentSlide = heroSlides[selectedSlideIndex];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAC9D1]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#FDF0F4] text-[#8C3A4F]">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-serif text-[#2D1B1B]">Homepage & Banner Studio</h1>
          </div>
          <p className="text-xs text-[#7A5B64] mt-1">
            Visually edit hero banner slides, add new banners & images, reorder homepage sections, or manage taskbar deals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const preset = SECTION_PRESETS[0];
              setSelectedPreset(preset.type);
              setNewSectionTitle(preset.defaultTitle);
              setNewSectionSubtitle(preset.defaultSubtitle);
              setIsAddSectionOpen(true);
            }}
            className="px-4 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#8C3A4F]/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Section</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 bg-white hover:bg-[#FCF8F9] text-[#2D1B1B] border border-[#EAC9D1] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs"
          >
            <ExternalLink className="w-4 h-4 text-[#8C3A4F]" />
            <span>Preview Storefront</span>
          </Link>
        </div>
      </div>

      {/* Taskbar Offers Control Banner */}
      <div className="bg-white border border-[#EAC9D1] rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                navbarOffersEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-[#8C3A4F] border-[#EAC9D1]'
              }`}
            >
              <Tag className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-bold text-[#2D1B1B] font-serif">Taskbar Offers Section</h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    navbarOffersEnabled
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {navbarOffersEnabled ? 'ON (Visible in Taskbar)' : 'OFF (Hidden in Taskbar)'}
                </span>
              </div>
              <p className="text-xs text-[#7A5B64] mt-1 max-w-2xl leading-relaxed">
                Turn ON or OFF the promotional <strong className="text-[#2D1B1B]">&ldquo;OFFERS SALE&rdquo;</strong> item in the top navigation taskbar (desktop header, sticky scrolled bar, and mobile drawer).
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={togglingNavbarOffers}
            onClick={handleToggleNavbarOffers}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
              navbarOffersEnabled
                ? 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300'
                : 'bg-[#8C3A4F] hover:bg-[#722E3F] text-white shadow-[#8C3A4F]/20'
            }`}
          >
            {navbarOffersEnabled ? (
              <>
                <EyeOff className="w-4 h-4 text-rose-500" />
                <span>{togglingNavbarOffers ? 'Saving...' : 'Turn OFF in Taskbar'}</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>{togglingNavbarOffers ? 'Saving...' : 'Turn ON in Taskbar'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A5B64]">
              Homepage Content Sections ({sections.length})
            </h3>
            <p className="text-xs text-[#A38D95]">
              Click &ldquo;Edit Section&rdquo; on the Hero Banner to change slides, upload images, or edit buttons.
            </p>
          </div>
          <span className="text-xs text-[#A38D95]">Reorder with arrows or toggle eye icon</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#7A5B64] bg-white border border-[#EAC9D1] rounded-2xl">
              Loading homepage sections...
            </div>
          ) : sections.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#EAC9D1] rounded-3xl space-y-3">
              <Sparkles className="w-8 h-8 text-[#8C3A4F] mx-auto opacity-70" />
              <h4 className="text-base font-bold text-[#2D1B1B]">No Custom Sections Configured Yet</h4>
              <p className="text-xs text-[#7A5B64] max-w-md mx-auto">
                Click &ldquo;Add New Section&rdquo; above to create your Hero Banner Slider or customize other homepage areas.
              </p>
            </div>
          ) : (
            sections.map((sec, idx) => {
              const isHero = sec.sectionType === 'HERO' || sec.sectionType === 'HERO_SLIDER';

              return (
                <div
                  key={sec.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    sec.active
                      ? isHero
                        ? 'bg-white border-[#8C3A4F]/40 shadow-xs ring-1 ring-[#8C3A4F]/10'
                        : 'bg-white border-[#EAC9D1] shadow-2xs'
                      : 'bg-stone-50 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-[#FDF0F4] text-[#8C3A4F] text-xs font-bold flex items-center justify-center shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[#2D1B1B] text-sm truncate">
                          {sec.title || sec.sectionType}
                        </h4>
                        <span className="text-[10px] font-mono text-[#8C3A4F] bg-[#FDF0F4] px-2 py-0.5 rounded-md border border-[#EAC9D1]">
                          {sec.sectionType}
                        </span>

                        {isHero && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Hero Slider</span>
                          </span>
                        )}

                        {sec.sectionType === 'BEST_SELLERS' && (
                          <Link
                            href="/admin/products"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full transition-all"
                          >
                            <Flame className="w-3 h-3 text-amber-600" />
                            <span>Manage Best Sellers</span>
                          </Link>
                        )}
                        {sec.sectionType === 'OFFER_BANNER' && (
                          <Link
                            href="/admin/products"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 hover:text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full transition-all"
                          >
                            <Tag className="w-3 h-3 text-rose-600" />
                            <span>Manage Deals</span>
                          </Link>
                        )}
                        {sec.sectionType === 'REVIEWS' && (
                          <Link
                            href="/admin/reviews?tab=HOME_PAGE_SHOWCASE"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full transition-all"
                          >
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Select Home Reviews</span>
                          </Link>
                        )}
                      </div>
                      {sec.subtitle && (
                        <p className="text-xs text-[#7A5B64] mt-0.5 truncate">{sec.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Reorder Buttons */}
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-2 bg-[#FCF8F9] hover:bg-[#FDF0F4] text-[#45363B] border border-[#EAC9D1] rounded-xl disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-2 bg-[#FCF8F9] hover:bg-[#FDF0F4] text-[#45363B] border border-[#EAC9D1] rounded-xl disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sec)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isHero
                          ? 'bg-[#8C3A4F] hover:bg-[#722E3F] text-white shadow-xs'
                          : 'bg-[#FDF0F4] hover:bg-rose-100 text-[#8C3A4F] border border-[#EAC9D1]'
                      }`}
                      title="Edit Section Content"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isHero ? 'Edit Hero Slides' : 'Edit Section'}</span>
                    </button>

                    {/* Active Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(sec)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        sec.active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-stone-100 text-stone-400 hover:text-stone-600'
                      }`}
                      title={sec.active ? 'Disable Section' : 'Enable Section'}
                    >
                      {sec.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(sec.id, sec.title || sec.sectionType)}
                      className="p-2 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT SECTION MODAL (WITH DEDICATED VISUAL HERO SLIDER BUILDER)           */}
      {/* ========================================================================= */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[#EAC9D1] rounded-3xl p-6 sm:p-8 max-w-4xl w-full my-auto shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAC9D1]">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-[#FDF0F4] text-[#8C3A4F]">
                  {isHeroSection ? <Sparkles className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#2D1B1B] font-serif">
                    {isHeroSection ? 'Hero Banner Studio & Slide Editor' : `Edit: ${editingSection.sectionType}`}
                  </h3>
                  <p className="text-xs text-[#7A5B64]">
                    {isHeroSection
                      ? 'Upload desktop/mobile banner images, customize headings, badges, and CTA links.'
                      : 'Customize section title, subtitle, and layout settings.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="p-2 text-stone-400 hover:text-[#2D1B1B] hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6 text-xs">
              {/* General Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#45363B] font-semibold mb-1.5">Section Title</label>
                  <input
                    type="text"
                    value={editingSection.title || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                    placeholder="e.g. Hero Banner Slider"
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#45363B] font-semibold mb-1.5">Section Subtitle</label>
                  <input
                    type="text"
                    value={editingSection.subtitle || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                    placeholder="e.g. Discover authentic ayurvedic formulations"
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              {/* HERO SLIDER VISUAL BUILDER */}
              {isHeroSection ? (
                <div className="space-y-6 pt-2">
                  {/* Slide Tabs & Add Slide Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FCF8F9] border border-[#EAC9D1] rounded-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#45363B] mr-1">Slides ({heroSlides.length}):</span>
                      {heroSlides.map((slide, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlideIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                            selectedSlideIndex === idx
                              ? 'bg-[#8C3A4F] text-white shadow-xs'
                              : 'bg-white hover:bg-stone-100 text-[#45363B] border border-[#EAC9D1]'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span className="max-w-[120px] truncate">{slide.heading || `Slide ${idx + 1}`}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSlide}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Slide</span>
                    </button>
                  </div>

                  {/* Currently Selected Slide Editor */}
                  {currentSlide && (
                    <div className="p-5 bg-white border border-[#EAC9D1] rounded-3xl space-y-5 shadow-xs">
                      {/* Slide Toolbar */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#EAC9D1]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2D1B1B] text-sm">
                            Editing Slide #{selectedSlideIndex + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveSlide(selectedSlideIndex, 'prev')}
                            disabled={selectedSlideIndex === 0}
                            className="p-1.5 bg-[#FCF8F9] hover:bg-[#FDF0F4] text-[#45363B] border border-[#EAC9D1] rounded-lg disabled:opacity-30 cursor-pointer"
                            title="Move Slide Left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSlide(selectedSlideIndex, 'next')}
                            disabled={selectedSlideIndex === heroSlides.length - 1}
                            className="p-1.5 bg-[#FCF8F9] hover:bg-[#FDF0F4] text-[#45363B] border border-[#EAC9D1] rounded-lg disabled:opacity-30 cursor-pointer"
                            title="Move Slide Right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlide(selectedSlideIndex)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Remove Slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Mini Preview Box */}
                      <div>
                        <span className="block text-[11px] font-bold text-[#7A5B64] uppercase tracking-wider mb-2">
                          Live Slide Preview
                        </span>
                        <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 flex items-center p-6 text-white shadow-inner">
                          {currentSlide.desktopImage && (
                            <Image
                              src={currentSlide.desktopImage}
                              alt="Preview"
                              fill
                              className="object-cover object-center opacity-60"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-transparent" />

                          <div className="relative z-10 max-w-md space-y-2">
                            {currentSlide.badge && (
                              <span className="inline-flex items-center gap-1.5 bg-[#8C3A4F] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-rose-400/40">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>{currentSlide.badge}</span>
                              </span>
                            )}
                            <h4 className="text-lg sm:text-xl font-bold font-serif leading-tight text-white drop-shadow-sm">
                              {currentSlide.heading || 'Slide Heading'}
                            </h4>
                            <p className="text-[11px] text-rose-100/90 line-clamp-2 leading-relaxed">
                              {currentSlide.subheading || 'Slide description...'}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              {currentSlide.ctaText && (
                                <span className="px-3 py-1 bg-amber-500 text-stone-950 rounded-lg text-[10px] font-bold uppercase">
                                  {currentSlide.ctaText}
                                </span>
                              )}
                              {currentSlide.secondaryCtaText && (
                                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase border border-white/30">
                                  {currentSlide.secondaryCtaText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Image Uploaders */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Desktop Image */}
                        <div className="space-y-2">
                          <label className="block text-[#45363B] font-semibold">
                            Desktop Banner Image URL (1920x800 recommended)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={currentSlide.desktopImage || ''}
                              onChange={(e) => handleUpdateCurrentSlide('desktopImage', e.target.value)}
                              placeholder="/images/banners/banner-1.jpg or https://..."
                              className="flex-1 bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                            />
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageFileUpload(file, false);
                              }}
                            />
                            <button
                              type="button"
                              disabled={uploadingImage}
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-2 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                              title="Upload Desktop Image"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Mobile Image */}
                        <div className="space-y-2">
                          <label className="block text-[#45363B] font-semibold">
                            Mobile Banner Image URL (Optional, 800x800 square)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={currentSlide.mobileImage || ''}
                              onChange={(e) => handleUpdateCurrentSlide('mobileImage', e.target.value)}
                              placeholder="/images/banners/banner-mobile.jpg"
                              className="flex-1 bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                            />
                            <input
                              type="file"
                              ref={mobileFileInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageFileUpload(file, true);
                              }}
                            />
                            <button
                              type="button"
                              disabled={uploadingImage}
                              onClick={() => mobileFileInputRef.current?.click()}
                              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-[#45363B] border border-stone-300 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                              title="Upload Mobile Image"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Promotional Badge Text (e.g. Authentic Ayurvedic Kshirapak Vidhi)
                          </label>
                          <input
                            type="text"
                            value={currentSlide.badge || ''}
                            onChange={(e) => handleUpdateCurrentSlide('badge', e.target.value)}
                            placeholder="Authentic Ayurvedic Kshirapak Vidhi"
                            className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Main Heading / Title
                          </label>
                          <input
                            type="text"
                            value={currentSlide.heading || ''}
                            onChange={(e) => handleUpdateCurrentSlide('heading', e.target.value)}
                            placeholder="e.g. Complete Hair Therapy Ritual Kits"
                            className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs font-semibold focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Subheading / Description Text
                          </label>
                          <textarea
                            rows={3}
                            value={currentSlide.subheading || ''}
                            onChange={(e) => handleUpdateCurrentSlide('subheading', e.target.value)}
                            placeholder="Stop hair fall, cleanse gently, and detangle with 21 Herbs Hair Oil, Shampoo with Conditioner & Handcrafted Neem Wood Comb."
                            className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden leading-relaxed"
                          />
                        </div>

                        {/* Primary CTA */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Primary Button Label
                          </label>
                          <input
                            type="text"
                            value={currentSlide.ctaText || ''}
                            onChange={(e) => handleUpdateCurrentSlide('ctaText', e.target.value)}
                            placeholder="e.g. EXPLORE KITS & COMBOS"
                            className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Primary Button Target URL
                          </label>
                          <input
                            type="text"
                            value={currentSlide.ctaUrl || ''}
                            onChange={(e) => handleUpdateCurrentSlide('ctaUrl', e.target.value)}
                            placeholder="e.g. /collections/combos or /products/..."
                            className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                          />
                        </div>

                        {/* Secondary CTA */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Secondary Button Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={currentSlide.secondaryCtaText || ''}
                            onChange={(e) => handleUpdateCurrentSlide('secondaryCtaText', e.target.value)}
                            placeholder="e.g. ORDER ON WHATSAPP"
                            className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Secondary Button Target URL (Optional)
                          </label>
                          <input
                            type="text"
                            value={currentSlide.secondaryCtaUrl || ''}
                            onChange={(e) => handleUpdateCurrentSlide('secondaryCtaUrl', e.target.value)}
                            placeholder="e.g. https://wa.me/918121961219"
                            className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-Hero Sections: Standard Content Configuration */
                <div>
                  <label className="block text-[#45363B] font-semibold mb-1.5">
                    Section Content & Settings (JSON)
                  </label>
                  <textarea
                    rows={6}
                    value={editingSection.contentJson || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, contentJson: e.target.value })
                    }
                    className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-[#2D1B1B] font-mono text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAC9D1]">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl font-bold transition-all shadow-md shadow-[#8C3A4F]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD NEW SECTION MODAL                                                    */}
      {/* ========================================================================= */}
      {isAddSectionOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#EAC9D1] rounded-3xl p-6 sm:p-8 max-w-xl w-full my-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAC9D1]">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-[#FDF0F4] text-[#8C3A4F]">
                  <Plus className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#2D1B1B] font-serif">Add New Homepage Section</h3>
                  <p className="text-xs text-[#7A5B64]">
                    Choose a preset section type to insert into your storefront layout.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddSectionOpen(false)}
                className="p-2 text-stone-400 hover:text-[#2D1B1B] hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-5 text-xs">
              <div>
                <label className="block text-[#45363B] font-semibold mb-2">Select Section Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1 border border-[#EAC9D1] rounded-2xl bg-[#FCF8F9]">
                  {SECTION_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPreset === preset.type;

                    return (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(preset.type);
                          setNewSectionTitle(preset.defaultTitle);
                          setNewSectionSubtitle(preset.defaultSubtitle);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#8C3A4F] text-white border-[#8C3A4F] shadow-xs'
                            : 'bg-white hover:bg-[#FDF0F4] text-[#2D1B1B] border-[#EAC9D1]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-white' : 'text-[#8C3A4F]'}`} />
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{preset.title}</p>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-rose-100' : 'text-[#7A5B64]'}`}>
                            {preset.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[#45363B] font-semibold mb-1.5">Section Title</label>
                <input
                  type="text"
                  required
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Best Sellers or Hero Slider"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#45363B] font-semibold mb-1.5">Section Subtitle (Optional)</label>
                <input
                  type="text"
                  value={newSectionSubtitle}
                  onChange={(e) => setNewSectionSubtitle(e.target.value)}
                  placeholder="e.g. Handcrafted with 21 potent herbs"
                  className="w-full bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl p-3 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAC9D1]">
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSection}
                  className="px-6 py-2.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl font-bold transition-all shadow-md shadow-[#8C3A4F]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingSection ? 'Creating...' : 'Create Section'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
