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
  Search,
  Check,
  Video,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Leaf,
  Award,
  Clock,
  Sliders,
  Package,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';


interface TrustBadge {
  id?: string;
  icon: string;
  title: string;
  subtitle: string;
}

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
    type: 'INGREDIENTS',
    title: '21 Sacred Ayurvedic Herbs',
    subtitle: 'Interactive botanical grid & formulation science',
    icon: Leaf,
    defaultTitle: 'THE 21 SACRED AYURVEDIC HERBS',
    defaultSubtitle: 'Slow-infused via 72-hour Kshirapak Vidhi with zero mineral oil',
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

  // Trust Badges Visual Editor State
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);

  // Best Sellers / Showcase Products Studio State
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [bsBadgeText, setBsBadgeText] = useState('Customer Favorites');
  const [bsViewAllText, setBsViewAllText] = useState('View All Products');
  const [bsViewAllUrl, setBsViewAllUrl] = useState('/collections/best-sellers');
  const [bsDisplayLimit, setBsDisplayLimit] = useState(8);
  const [bsSelectedProductIds, setBsSelectedProductIds] = useState<string[]>([]);
  const [bsActiveTab, setBsActiveTab] = useState<'products' | 'header' | 'preview'>('products');
  const [bsSearchTerm, setBsSearchTerm] = useState('');

  // Combo Showcase Studio State (DISCOVER Section)
  const [comboBadge, setComboBadge] = useState('THE ULTIMATE 3-IN-1 HAIR CARE COMBO');
  const [comboHeading, setComboHeading] = useState('Complete Hair Therapy Kit');
  const [comboSubtitle, setComboSubtitle] = useState('21 HERBS OIL (190ML) + HERBAL SHAMPOO (200ML) + NEEM WOOD COMB');
  const [comboRatingScore, setComboRatingScore] = useState('4.9 / 5');
  const [comboRatingText, setComboRatingText] = useState('1,480+ Verified Results');
  const [comboRegularPrice, setComboRegularPrice] = useState(1448);
  const [comboSalePrice, setComboSalePrice] = useState(1158);
  const [comboSaveText, setComboSaveText] = useState('Save ₹290 (20% OFF)');
  const [comboDeliveryBadge, setComboDeliveryBadge] = useState('Free Express Delivery');
  const [comboImage, setComboImage] = useState('/images/products/herbic-cure/herbic-cure-oil-shampoo-comb-trio.jpg');
  const [comboImageTag, setComboImageTag] = useState('SAVE 20% OFF COMBO');
  const [comboOverlayTitle, setComboOverlayTitle] = useState('COMPLETE 3-STEP AYURVEDIC REGROWTH ROUTINE');
  const [comboOverlaySubtitle, setComboOverlaySubtitle] = useState('21 Herbs Fusion Oil + Herbal Shampoo + Pure Neem Wood Comb');
  const [comboFloatingCardTitle, setComboFloatingCardTitle] = useState('100% Ayurvedic Therapy');
  const [comboFloatingCardSubtitle, setComboFloatingCardSubtitle] = useState('Paraben, Sulphate & Mineral Oil Free');
  const [comboProductSlug, setComboProductSlug] = useState('herbic-cure-complete-hair-therapy-kit');
  const [comboSteps, setComboSteps] = useState<Array<{ step: string; title: string; desc: string; tag: string }>>([
    {
      step: '01',
      title: '21 Herbs Fusion Hair Oil (190ml)',
      desc: 'Infused with 21 Ayurvedic herbs & roots. Nourishes dormant follicles and controls hair fall from root.',
      tag: 'Pre-Wash Care',
    },
    {
      step: '02',
      title: 'Shampoo with Conditioner (200ml)',
      desc: 'Enriched with Neem, Tulsi & Argan Oil. Gently cleanses buildup without stripping natural scalp moisture.',
      tag: 'Gentle Wash',
    },
    {
      step: '03',
      title: 'Handcrafted Neem Wood Comb',
      desc: 'Anti-static wide teeth comb. Stimulates scalp micro-circulation and prevents mechanical breakage.',
      tag: 'Scalp Activation',
    },
  ]);
  const [comboActiveTab, setComboActiveTab] = useState<'pricing' | 'content' | 'preview'>('pricing');

  const fetchStoreProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (Array.isArray(data.products)) {
        setAllProducts(data.products);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchStoreProducts();
  }, []);
  const [heroActiveTab, setHeroActiveTab] = useState<'slides' | 'badges'>('slides');

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
    if (sec.sectionType === 'DISCOVER') {
      try {
        const parsed = JSON.parse(sec.contentJson || '{}');
        setComboBadge(parsed.badge || 'THE ULTIMATE 3-IN-1 HAIR CARE COMBO');
        setComboHeading(parsed.heading || sec.title || 'Complete Hair Therapy Kit');
        setComboSubtitle(parsed.subtitle || sec.subtitle || '21 HERBS OIL (190ML) + HERBAL SHAMPOO (200ML) + NEEM WOOD COMB');
        setComboRatingScore(parsed.ratingScore || '4.9 / 5');
        setComboRatingText(parsed.ratingText || '1,480+ Verified Results');
        setComboRegularPrice(Number(parsed.regularPrice) || 1448);
        setComboSalePrice(Number(parsed.salePrice) || 1158);
        setComboSaveText(parsed.saveText || 'Save ₹290 (20% OFF)');
        setComboDeliveryBadge(parsed.deliveryBadge || 'Free Express Delivery');
        setComboImage(parsed.image || '/images/products/herbic-cure/herbic-cure-oil-shampoo-comb-trio.jpg');
        setComboImageTag(parsed.imageTag || 'SAVE 20% OFF COMBO');
        setComboOverlayTitle(parsed.overlayTitle || 'COMPLETE 3-STEP AYURVEDIC REGROWTH ROUTINE');
        setComboOverlaySubtitle(parsed.overlaySubtitle || '21 Herbs Fusion Oil + Herbal Shampoo + Pure Neem Wood Comb');
        setComboFloatingCardTitle(parsed.floatingCardTitle || '100% Ayurvedic Therapy');
        setComboFloatingCardSubtitle(parsed.floatingCardSubtitle || 'Paraben, Sulphate & Mineral Oil Free');
        setComboProductSlug(parsed.productSlug || 'herbic-cure-complete-hair-therapy-kit');
        if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          setComboSteps(parsed.steps);
        } else {
          setComboSteps([
            {
              step: '01',
              title: '21 Herbs Fusion Hair Oil (190ml)',
              desc: 'Infused with 21 Ayurvedic herbs & roots. Nourishes dormant follicles and controls hair fall from root.',
              tag: 'Pre-Wash Care',
            },
            {
              step: '02',
              title: 'Shampoo with Conditioner (200ml)',
              desc: 'Enriched with Neem, Tulsi & Argan Oil. Gently cleanses buildup without stripping natural scalp moisture.',
              tag: 'Gentle Wash',
            },
            {
              step: '03',
              title: 'Handcrafted Neem Wood Comb',
              desc: 'Anti-static wide teeth comb. Stimulates scalp micro-circulation and prevents mechanical breakage.',
              tag: 'Scalp Activation',
            },
          ]);
        }
      } catch {
        // Fallback
      }
      setComboActiveTab('pricing');
    }

    if (sec.sectionType === 'BEST_SELLERS' || sec.sectionType === 'FEATURED_PRODUCTS') {
      try {
        const parsed = JSON.parse(sec.contentJson || '{}');
        setBsBadgeText(parsed.badgeText || (sec.sectionType === 'BEST_SELLERS' ? 'Customer Favorites' : 'Curated Selection'));
        setBsViewAllText(parsed.viewAllText || 'View All Products');
        setBsViewAllUrl(parsed.viewAllUrl || (sec.sectionType === 'BEST_SELLERS' ? '/collections/best-sellers' : '/products'));
        setBsDisplayLimit(Number(parsed.displayLimit) || 8);
        if (Array.isArray(parsed.productIds) && parsed.productIds.length > 0) {
          setBsSelectedProductIds(parsed.productIds);
        } else {
          // Preselect marked best sellers or first 8 products
          const marked = allProducts.filter((p: any) => p.isBestSeller).map((p: any) => p.id);
          setBsSelectedProductIds(marked.length > 0 ? marked : allProducts.slice(0, 8).map((p: any) => p.id));
        }
      } catch {
        setBsBadgeText('Customer Favorites');
        setBsViewAllText('View All Products');
        setBsViewAllUrl('/collections/best-sellers');
        setBsDisplayLimit(8);
        setBsSelectedProductIds(allProducts.slice(0, 8).map((p: any) => p.id));
      }
      setBsActiveTab('products');
    }

    if (sec.sectionType === 'HERO' || sec.sectionType === 'HERO_SLIDER') {
      const defaultBadges: TrustBadge[] = [
        { id: 'badge-1', icon: 'shield', title: '100% Ayurvedic', subtitle: 'Zero mineral oil & silicones' },
        { id: 'badge-2', icon: 'truck', title: 'Free Express Delivery', subtitle: 'On all orders above ₹499' },
        { id: 'badge-3', icon: 'sparkles', title: '21 Potent Herbs', subtitle: 'Kshirapak 72hr slow infusion' },
        { id: 'badge-4', icon: 'heart', title: '2,50,000+ Customers', subtitle: '4.9/5 rated hair growth results' },
      ];
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
        if (Array.isArray(parsed.trustBadges) && parsed.trustBadges.length > 0) {
          setTrustBadges(parsed.trustBadges);
        } else {
          setTrustBadges(defaultBadges);
        }
      } catch {
        setHeroSlides([]);
        setTrustBadges(defaultBadges);
      }
      setHeroActiveTab('slides');
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
      finalContentJson = JSON.stringify({ slides: heroSlides, trustBadges }, null, 2);
    }

    // If it's Best Sellers or Featured Products section, serialize product IDs and headers
    if (editingSection.sectionType === 'BEST_SELLERS' || editingSection.sectionType === 'FEATURED_PRODUCTS') {
      finalContentJson = JSON.stringify({
        badgeText: bsBadgeText,
        viewAllText: bsViewAllText,
        viewAllUrl: bsViewAllUrl,
        displayLimit: bsDisplayLimit,
        productIds: bsSelectedProductIds,
      }, null, 2);
    }

    // If it's Combo Showcase (DISCOVER), serialize combo config
    if (editingSection.sectionType === 'DISCOVER') {
      finalContentJson = JSON.stringify({
        badge: comboBadge,
        heading: comboHeading,
        subtitle: comboSubtitle,
        ratingScore: comboRatingScore,
        ratingText: comboRatingText,
        regularPrice: Number(comboRegularPrice),
        salePrice: Number(comboSalePrice),
        saveText: comboSaveText,
        deliveryBadge: comboDeliveryBadge,
        image: comboImage,
        imageTag: comboImageTag,
        overlayTitle: comboOverlayTitle,
        overlaySubtitle: comboOverlaySubtitle,
        floatingCardTitle: comboFloatingCardTitle,
        floatingCardSubtitle: comboFloatingCardSubtitle,
        productSlug: comboProductSlug,
        steps: comboSteps,
      }, null, 2);
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

  const isBestSellersSection =
    editingSection?.sectionType === 'BEST_SELLERS' || editingSection?.sectionType === 'FEATURED_PRODUCTS';

  const isComboSection = editingSection?.sectionType === 'DISCOVER';

  const currentSlide = heroSlides[selectedSlideIndex];

  
  const handleUpdateBadge = (index: number, field: keyof TrustBadge, value: string) => {
    setTrustBadges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleResetBadgesToDefault = () => {
    setTrustBadges([
      { id: 'badge-1', icon: 'shield', title: '100% Ayurvedic', subtitle: 'Zero mineral oil & silicones' },
      { id: 'badge-2', icon: 'truck', title: 'Free Express Delivery', subtitle: 'On all orders above ₹499' },
      { id: 'badge-3', icon: 'sparkles', title: '21 Potent Herbs', subtitle: 'Kshirapak 72hr slow infusion' },
      { id: 'badge-4', icon: 'heart', title: '2,50,000+ Customers', subtitle: '4.9/5 rated hair growth results' },
    ]);
    toast.success('Reset trust badges to default values');
  };

  const renderBadgeIconPreview = (iconName?: string) => {
    const norm = (iconName || '').toLowerCase().trim();
    switch (norm) {
      case 'truck':
        return <Truck className="w-4 h-4" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'heart':
        return <HeartHandshake className="w-4 h-4" />;
      case 'leaf':
        return <Leaf className="w-4 h-4" />;
      case 'award':
        return <Award className="w-4 h-4" />;
      case 'check':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'clock':
        return <Clock className="w-4 h-4" />;
      case 'star':
        return <Star className="w-4 h-4" />;
      case 'flame':
        return <Flame className="w-4 h-4" />;
      case 'shield':
      default:
        return <ShieldCheck className="w-4 h-4" />;
    }
  };

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
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sec)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs"
                          >
                            <Flame className="w-3 h-3 text-amber-600" />
                            <span>Edit Showcase Products ({allProducts.length})</span>
                          </button>
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
                    {isHeroSection
                      ? 'Hero Banner Studio & Slide Editor'
                      : isBestSellersSection
                      ? 'Best Selling Rituals & Showcase Products Studio'
                      : isComboSection
                      ? 'Combo Showcase & 3-in-1 Therapy Kit Studio'
                      : `Edit: ${editingSection.sectionType}`}
                  </h3>
                  <p className="text-xs text-[#7A5B64]">
                    {isHeroSection
                      ? 'Upload desktop/mobile banner images, customize headings, badges, and CTA links.'
                      : isBestSellersSection
                      ? 'Select which products appear in this homepage section, reorder their cards, and customize badges & links.'
                      : isComboSection
                      ? 'Customize combo pricing, modern font, product images, discounts, and 3 ritual steps.'
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
                  {/* Hero Sub-section Tabs */}
                  <div className="flex border-b border-[#EAC9D1] gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setHeroActiveTab('slides')}
                      className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        heroActiveTab === 'slides'
                          ? 'border-[#8C3A4F] text-[#8C3A4F]'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Hero Banner Slides ({heroSlides.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroActiveTab('badges')}
                      className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        heroActiveTab === 'badges'
                          ? 'border-[#8C3A4F] text-[#8C3A4F]'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      4 Trust Badges & Guarantee Strip ({trustBadges.length})
                    </button>
                  </div>

                  {heroActiveTab === 'slides' ? (
                    <div className="space-y-6">
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
                    /* TRUST BADGES & GUARANTEE STRIP VISUAL EDITOR */
                    <div className="space-y-6">
                      <div className="bg-[#FDF0F4] border border-[#EAC9D1] rounded-2xl p-4 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#8C3A4F] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[#2D1B1B] text-xs">Hero Trust Badges Strip (4 Feature Pillars)</h4>
                            <button
                              type="button"
                              onClick={handleResetBadgesToDefault}
                              className="text-[11px] text-[#8C3A4F] hover:underline font-semibold cursor-pointer"
                            >
                              Reset to Defaults
                            </button>
                          </div>
                          <p className="text-[11px] text-[#7A5B64] mt-0.5 leading-relaxed">
                            These 4 highlight cards appear directly underneath the main Hero Banner Slider on both desktop and mobile. You can customize the icon, main title, and sub-description for each badge card below.
                          </p>
                        </div>
                      </div>

                      {/* 4 Badges Editor Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trustBadges.map((badge, idx) => (
                          <div
                            key={badge.id || idx}
                            className="bg-[#FCF8F9] border border-[#EAC9D1] rounded-2xl p-4 space-y-3 relative hover:border-[#8C3A4F]/40 transition-all shadow-xs"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-[#EAC9D1]/60">
                              <span className="font-bold text-[#8C3A4F] text-xs flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-rose-100 text-[#8C3A4F] flex items-center justify-center text-[10px] font-bold">
                                  {idx + 1}
                                </span>
                                Badge #{idx + 1}
                              </span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-[#EAC9D1] text-[10px] font-semibold text-stone-600">
                                {renderBadgeIconPreview(badge.icon)}
                                <span>{badge.icon.toUpperCase()}</span>
                              </div>
                            </div>

                            {/* Icon Choice Dropdown */}
                            <div>
                              <label className="block text-[#45363B] font-semibold text-[11px] mb-1">Badge Icon</label>
                              <select
                                value={badge.icon || 'shield'}
                                onChange={(e) => handleUpdateBadge(idx, 'icon', e.target.value)}
                                className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden font-medium"
                              >
                                <option value="shield">🛡️ ShieldCheck — 100% Ayurvedic / Zero Mineral Oil</option>
                                <option value="truck">🚚 Truck — Free Express Delivery</option>
                                <option value="sparkles">✨ Sparkles — 21 Potent Herbs / Infusion</option>
                                <option value="heart">🤝 HeartHandshake — Satisfied Customers / Ratings</option>
                                <option value="leaf">🌿 Leaf — Botanical / Natural Extracts</option>
                                <option value="award">🏆 Award — Ayurvedic Certified / Guaranteed</option>
                                <option value="check">✔ CheckCircle — Verified Formulation</option>
                                <option value="clock">⏱️ Clock — 72hr Slow Cooking / Fast Dispatch</option>
                                <option value="star">⭐ Star — 5-Star Reviews</option>
                                <option value="flame">🔥 Flame — Bestselling Ritual</option>
                              </select>
                            </div>

                            {/* Badge Title */}
                            <div>
                              <label className="block text-[#45363B] font-semibold text-[11px] mb-1">Badge Title</label>
                              <input
                                type="text"
                                value={badge.title || ''}
                                onChange={(e) => handleUpdateBadge(idx, 'title', e.target.value)}
                                placeholder="e.g. 100% Ayurvedic"
                                className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs font-bold focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                              />
                            </div>

                            {/* Badge Subtitle */}
                            <div>
                              <label className="block text-[#45363B] font-semibold text-[11px] mb-1">Subtitle / Sub-text</label>
                              <input
                                type="text"
                                value={badge.subtitle || ''}
                                onChange={(e) => handleUpdateBadge(idx, 'subtitle', e.target.value)}
                                placeholder="e.g. Zero mineral oil & silicones"
                                className="w-full bg-white border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Live Visual Preview Section */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#45363B] font-bold text-xs flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-[#8C3A4F]" />
                            Live Storefront Preview
                          </span>
                          <span className="text-[10px] text-stone-500">Updates live as you type</span>
                        </div>

                        <div className="bg-white border border-stone-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                            {trustBadges.map((badge, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50/70 border border-stone-100"
                              >
                                <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-[#A84358] flex items-center justify-center shrink-0">
                                  {renderBadgeIconPreview(badge.icon)}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-stone-900 leading-snug truncate">
                                    {badge.title || 'Badge Title'}
                                  </h5>
                                  <p className="text-[10px] text-stone-500 leading-normal truncate">
                                    {badge.subtitle || 'Badge Subtitle'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : isBestSellersSection ? (
                /* BEST SELLERS & SHOWCASE PRODUCTS STUDIO */
                <div className="space-y-6 pt-1">
                  {/* Studio Navigation Tabs */}
                  <div className="flex border-b border-[#EAC9D1] gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setBsActiveTab('products')}
                      className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        bsActiveTab === 'products'
                          ? 'border-[#8C3A4F] text-[#8C3A4F]'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>Select &amp; Order Products</span>
                      <span className="ml-1 text-[10px] bg-[#FDF0F4] text-[#8C3A4F] border border-[#EAC9D1] px-2 py-0.5 rounded-full font-mono">
                        {bsSelectedProductIds.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBsActiveTab('header')}
                      className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        bsActiveTab === 'header'
                          ? 'border-[#8C3A4F] text-[#8C3A4F]'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Flame className="w-4 h-4" />
                      <span>Badges &amp; View All Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBsActiveTab('preview')}
                      className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        bsActiveTab === 'preview'
                          ? 'border-[#8C3A4F] text-[#8C3A4F]'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Live Storefront Preview</span>
                    </button>
                  </div>

                  {/* TAB 1: PRODUCT PICKER & REORDERING */}
                  {bsActiveTab === 'products' && (
                    <div className="space-y-5">
                      {/* Top Action Toolbar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCF8F9] p-3 rounded-2xl border border-[#EAC9D1]">
                        <div className="relative flex-1 max-w-xs">
                          <input
                            type="text"
                            value={bsSearchTerm}
                            onChange={(e) => setBsSearchTerm(e.target.value)}
                            placeholder="Search store products..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30"
                          />
                          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setBsSelectedProductIds(allProducts.map((p) => p.id))}
                            className="px-2.5 py-1.5 text-[11px] font-bold bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg transition-all cursor-pointer"
                          >
                            Select All ({allProducts.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const bIds = allProducts.filter((p) => p.isBestSeller).map((p) => p.id);
                              setBsSelectedProductIds(bIds.length > 0 ? bIds : allProducts.slice(0, 8).map((p) => p.id));
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Flame className="w-3 h-3 text-amber-600" />
                            <span>Auto Best Sellers</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBsSelectedProductIds([])}
                            className="px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Section 1: Selected Products with Move Up/Down Ordering */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-[#2D1B1B] uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#8C3A4F]" />
                            <span>Products In Homepage Section (In Exact Display Order)</span>
                          </span>
                          <span className="text-[11px] text-[#7A5B64]">
                            Showing {Math.min(bsSelectedProductIds.length, bsDisplayLimit)} of {bsSelectedProductIds.length} active on homepage
                          </span>
                        </div>

                        {bsSelectedProductIds.length === 0 ? (
                          <div className="p-8 text-center bg-[#FCF8F9] rounded-2xl border border-dashed border-[#EAC9D1] text-[#7A5B64] text-xs">
                            No products currently selected. Click &quot;+ Add&quot; below or click &quot;Auto Best Sellers&quot;.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {bsSelectedProductIds.map((pId, idx) => {
                              const prod = allProducts.find((p) => p.id === pId);
                              if (!prod) return null;
                              const isOverLimit = idx >= bsDisplayLimit;

                              return (
                                <div
                                  key={pId}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                    isOverLimit
                                      ? 'bg-stone-50 border-stone-200 opacity-60'
                                      : 'bg-white border-[#EAC9D1] shadow-2xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Order Badge */}
                                    <span className="w-6 h-6 rounded-lg bg-[#FDF0F4] text-[#8C3A4F] font-bold text-[11px] flex items-center justify-center border border-[#EAC9D1] shrink-0">
                                      #{idx + 1}
                                    </span>

                                    {/* Image */}
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative">
                                      {prod.images?.[0]?.url ? (
                                        <Image
                                          src={prod.images[0].url}
                                          alt={prod.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                                          <Package className="w-4 h-4" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Name & Details */}
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-[#2D1B1B] truncate">{prod.name}</p>
                                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                                        <span className="font-semibold text-[#8C3A4F]">₹{prod.salePrice || prod.regularPrice}</span>
                                        {prod.salePrice && (
                                          <span className="line-through text-stone-400">₹{prod.regularPrice}</span>
                                        )}
                                        {prod.isBestSeller && (
                                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-sm border border-amber-300">
                                            BEST SELLER
                                          </span>
                                        )}
                                        {isOverLimit && (
                                          <span className="text-[9px] text-stone-400 italic">
                                            (Hidden by max {bsDisplayLimit} limit)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Reorder and Remove Controls */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => {
                                        const next = [...bsSelectedProductIds];
                                        const temp = next[idx];
                                        next[idx] = next[idx - 1];
                                        next[idx - 1] = temp;
                                        setBsSelectedProductIds(next);
                                      }}
                                      className="p-1.5 hover:bg-[#FDF0F4] text-stone-500 hover:text-[#8C3A4F] rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move Up"
                                    >
                                      <MoveUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === bsSelectedProductIds.length - 1}
                                      onClick={() => {
                                        const next = [...bsSelectedProductIds];
                                        const temp = next[idx];
                                        next[idx] = next[idx + 1];
                                        next[idx + 1] = temp;
                                        setBsSelectedProductIds(next);
                                      }}
                                      className="p-1.5 hover:bg-[#FDF0F4] text-stone-500 hover:text-[#8C3A4F] rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move Down"
                                    >
                                      <MoveDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBsSelectedProductIds(bsSelectedProductIds.filter((id) => id !== pId));
                                      }}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                                      title="Remove from Section"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Other Available Products in Store */}
                      {allProducts.some((p) => !bsSelectedProductIds.includes(p.id)) && (
                        <div className="pt-2">
                          <span className="font-bold text-xs text-[#45363B] uppercase tracking-wider block mb-2">
                            Available Products In Store (Click To Add)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {allProducts
                              .filter(
                                (p) =>
                                  !bsSelectedProductIds.includes(p.id) &&
                                  (bsSearchTerm === '' ||
                                    p.name.toLowerCase().includes(bsSearchTerm.toLowerCase()))
                              )
                              .map((prod) => (
                                <div
                                  key={prod.id}
                                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white hover:border-[#8C3A4F] transition-all"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative">
                                      {prod.images?.[0]?.url ? (
                                        <Image
                                          src={prod.images[0].url}
                                          alt={prod.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <Package className="w-4 h-4 text-stone-400 m-auto" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-[#2D1B1B] truncate">{prod.name}</p>
                                      <p className="text-[11px] text-[#8C3A4F] font-semibold">₹{prod.salePrice || prod.regularPrice}</p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setBsSelectedProductIds([...bsSelectedProductIds, prod.id])}
                                    className="px-2.5 py-1 bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-[11px] font-bold rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add</span>
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: HEADER, BADGES & VIEW ALL LINK */}
                  {bsActiveTab === 'header' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Top Pill Badge Text
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={bsBadgeText}
                              onChange={(e) => setBsBadgeText(e.target.value)}
                              placeholder="e.g. Customer Favorites"
                              className="w-full pl-8 pr-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                            />
                            <Flame className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Display Limit on Homepage
                          </label>
                          <select
                            value={bsDisplayLimit}
                            onChange={(e) => setBsDisplayLimit(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          >
                            <option value={4}>Show Top 4 Products</option>
                            <option value={8}>Show Top 8 Products (Recommended)</option>
                            <option value={12}>Show Top 12 Products</option>
                            <option value={999}>Show All Selected Products</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            &quot;View All&quot; Button Label
                          </label>
                          <input
                            type="text"
                            value={bsViewAllText}
                            onChange={(e) => setBsViewAllText(e.target.value)}
                            placeholder="e.g. View All Products (9)"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            &quot;View All&quot; Destination URL
                          </label>
                          <input
                            type="text"
                            value={bsViewAllUrl}
                            onChange={(e) => setBsViewAllUrl(e.target.value)}
                            placeholder="e.g. /collections/best-sellers or /products"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIVE STOREFRONT PREVIEW */}
                  {bsActiveTab === 'preview' && (
                    <div className="p-4 sm:p-6 bg-[#FCF8F9] rounded-2xl border border-[#EAC9D1] space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#EAC9D1]">
                        <div>
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-2.5 py-0.5 rounded-full mb-1">
                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{bsBadgeText}</span>
                          </div>
                          <h4 className="text-lg font-extrabold text-stone-900 font-serif">
                            {editingSection.title || 'Best Selling Hair Rituals'}
                          </h4>
                          <p className="text-xs text-stone-600 mt-0.5 max-w-lg">
                            {editingSection.subtitle || 'Handcrafted with 21 potent herbs for visible restoration'}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#A84358] inline-flex items-center gap-1">
                          <span>{bsViewAllText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {bsSelectedProductIds.slice(0, bsDisplayLimit).map((pId) => {
                          const prod = allProducts.find((p) => p.id === pId);
                          if (!prod) return null;
                          const discount = prod.salePrice
                            ? Math.round(((prod.regularPrice - prod.salePrice) / prod.regularPrice) * 100)
                            : 0;

                          return (
                            <div key={pId} className="bg-white rounded-2xl p-2 border border-stone-200 shadow-2xs space-y-2">
                              <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative">
                                {prod.images?.[0]?.url ? (
                                  <Image
                                    src={prod.images[0].url}
                                    alt={prod.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-stone-400 m-auto" />
                                )}
                                {discount > 0 && (
                                  <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md">
                                    {discount}% OFF
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-[11px] text-stone-900 truncate">{prod.name}</p>
                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#8C3A4F] mt-0.5">
                                  <span>₹{prod.salePrice || prod.regularPrice}</span>
                                  {prod.salePrice && (
                                    <span className="line-through text-stone-400 font-normal text-[10px]">
                                      ₹{prod.regularPrice}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-full py-1.5 bg-[#8C3A4F] text-white rounded-xl text-[10px] font-bold text-center">
                                ADD TO BAG
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : isComboSection ? (
                /* COMBO SHOWCASE & 3-IN-1 THERAPY KIT STUDIO */
                <div className="space-y-6 pt-1">
                  {/* Studio Navigation Tabs */}
                  <div className="flex border-b border-[#EAC9D1] gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setComboActiveTab('pricing')}
                      className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        comboActiveTab === 'pricing'
                          ? 'border-[#8C3A4F] text-[#8C3A4F]'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      <span>Pricing &amp; Headings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComboActiveTab('content')}
                      className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        comboActiveTab === 'content'
                          ? 'border-[#8C3A4F] text-[#8C3A4F]'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Image &amp; 3 Ritual Steps</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComboActiveTab('preview')}
                      className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        comboActiveTab === 'preview'
                          ? 'border-[#8C3A4F] text-[#8C3A4F]'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Live Storefront Preview</span>
                    </button>
                  </div>

                  {/* TAB 1: PRICING & HEADINGS */}
                  {comboActiveTab === 'pricing' && (
                    <div className="space-y-5">
                      {/* Price Highlight Banner */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FDF0F4] to-amber-50/60 border border-[#EAC9D1] flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C3A4F] block">
                            Combo Price Display (Clean Sans-Serif Tabular Font)
                          </span>
                          <div className="flex items-baseline gap-2.5 mt-1 font-sans">
                            <span className="text-3xl font-extrabold text-[#2D1B1B] tabular-nums">
                              ₹{Number(comboSalePrice).toLocaleString('en-IN')}
                            </span>
                            {Number(comboRegularPrice) > Number(comboSalePrice) && (
                              <span className="text-sm font-bold text-stone-400 line-through tabular-nums">
                                ₹{Number(comboRegularPrice).toLocaleString('en-IN')}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-[#8C3A4F] text-white text-[11px] font-bold">
                              {comboSaveText || `Save ₹${comboRegularPrice - comboSalePrice}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{comboDeliveryBadge}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Special Price */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Combo Special Price (₹)
                          </label>
                          <input
                            type="number"
                            value={comboSalePrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setComboSalePrice(val);
                              if (comboRegularPrice > val) {
                                const diff = comboRegularPrice - val;
                                const pct = Math.round((diff / comboRegularPrice) * 100);
                                setComboSaveText(`Save ₹${diff} (${pct}% OFF)`);
                              }
                            }}
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white font-bold text-[#8C3A4F]"
                          />
                        </div>

                        {/* Regular Price */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Regular Strike-Through Price (₹)
                          </label>
                          <input
                            type="number"
                            value={comboRegularPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setComboRegularPrice(val);
                              if (val > comboSalePrice) {
                                const diff = val - comboSalePrice;
                                const pct = Math.round((diff / val) * 100);
                                setComboSaveText(`Save ₹${diff} (${pct}% OFF)`);
                              }
                            }}
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white font-semibold"
                          />
                        </div>

                        {/* Save Discount Text */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Discount Badge Text
                          </label>
                          <input
                            type="text"
                            value={comboSaveText}
                            onChange={(e) => setComboSaveText(e.target.value)}
                            placeholder="e.g. Save ₹290 (20% OFF)"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          />
                        </div>

                        {/* Delivery Badge */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Delivery Badge Label
                          </label>
                          <input
                            type="text"
                            value={comboDeliveryBadge}
                            onChange={(e) => setComboDeliveryBadge(e.target.value)}
                            placeholder="e.g. Free Express Delivery"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          />
                        </div>

                        {/* Top Badge */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Top Pill Tagline
                          </label>
                          <input
                            type="text"
                            value={comboBadge}
                            onChange={(e) => setComboBadge(e.target.value)}
                            placeholder="e.g. THE ULTIMATE 3-IN-1 HAIR CARE COMBO"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          />
                        </div>

                        {/* Heading */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Kit Main Heading
                          </label>
                          <input
                            type="text"
                            value={comboHeading}
                            onChange={(e) => {
                              setComboHeading(e.target.value);
                              setEditingSection({ ...editingSection, title: e.target.value });
                            }}
                            placeholder="e.g. Complete Hair Therapy Kit"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white font-bold"
                          />
                        </div>

                        {/* Subtitle */}
                        <div className="sm:col-span-2">
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Kit Subheading / Included Products Description
                          </label>
                          <input
                            type="text"
                            value={comboSubtitle}
                            onChange={(e) => {
                              setComboSubtitle(e.target.value);
                              setEditingSection({ ...editingSection, subtitle: e.target.value });
                            }}
                            placeholder="e.g. 21 HERBS OIL (190ML) + HERBAL SHAMPOO (200ML) + NEEM WOOD COMB"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          />
                        </div>

                        {/* Rating Score */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Rating Score
                          </label>
                          <input
                            type="text"
                            value={comboRatingScore}
                            onChange={(e) => setComboRatingScore(e.target.value)}
                            placeholder="e.g. 4.9 / 5"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          />
                        </div>

                        {/* Rating Verified Count */}
                        <div>
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Verified Results Text
                          </label>
                          <input
                            type="text"
                            value={comboRatingText}
                            onChange={(e) => setComboRatingText(e.target.value)}
                            placeholder="e.g. 1,480+ Verified Results"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white"
                          />
                        </div>

                        {/* Product Slug */}
                        <div className="sm:col-span-2">
                          <label className="block text-[#45363B] font-semibold mb-1">
                            Destination Product Slug (For specs link &amp; cart checkout)
                          </label>
                          <input
                            type="text"
                            value={comboProductSlug}
                            onChange={(e) => setComboProductSlug(e.target.value)}
                            placeholder="e.g. herbic-cure-complete-hair-therapy-kit"
                            className="w-full px-3 py-2 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 focus:bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: IMAGE & 3 RITUAL STEPS */}
                  {comboActiveTab === 'content' && (
                    <div className="space-y-5">
                      {/* Product Image Settings */}
                      <div className="p-4 rounded-2xl bg-[#FCF8F9] border border-[#EAC9D1] space-y-3">
                        <label className="block text-[#45363B] font-bold text-xs uppercase tracking-wider">
                          Combo Product Showcase Image
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={comboImage}
                            onChange={(e) => setComboImage(e.target.value)}
                            placeholder="/images/products/herbic-cure/combo.jpg or https://..."
                            className="flex-1 bg-white border border-[#EAC9D1] rounded-xl p-2.5 text-[#2D1B1B] text-xs focus:ring-2 focus:ring-[#8C3A4F]/30 outline-hidden font-mono"
                          />
                          <button
                            type="button"
                            disabled={uploadingImage}
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-2 bg-[#8C3A4F] hover:bg-[#722E3F] text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Image</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[#45363B] font-semibold mb-1">
                              Corner Tag on Image
                            </label>
                            <input
                              type="text"
                              value={comboImageTag}
                              onChange={(e) => setComboImageTag(e.target.value)}
                              placeholder="e.g. SAVE 20% OFF COMBO"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30"
                            />
                          </div>
                          <div>
                            <label className="block text-[#45363B] font-semibold mb-1">
                              Floating Trust Card Title
                            </label>
                            <input
                              type="text"
                              value={comboFloatingCardTitle}
                              onChange={(e) => setComboFloatingCardTitle(e.target.value)}
                              placeholder="e.g. 100% Ayurvedic Therapy"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30"
                            />
                          </div>
                          <div>
                            <label className="block text-[#45363B] font-semibold mb-1">
                              Image Overlay Title
                            </label>
                            <input
                              type="text"
                              value={comboOverlayTitle}
                              onChange={(e) => setComboOverlayTitle(e.target.value)}
                              placeholder="e.g. COMPLETE 3-STEP AYURVEDIC REGROWTH ROUTINE"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30"
                            />
                          </div>
                          <div>
                            <label className="block text-[#45363B] font-semibold mb-1">
                              Image Overlay Subtitle
                            </label>
                            <input
                              type="text"
                              value={comboOverlaySubtitle}
                              onChange={(e) => setComboOverlaySubtitle(e.target.value)}
                              placeholder="e.g. 21 Herbs Fusion Oil + Herbal Shampoo + Pure Neem Wood Comb"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3 Ritual Steps Editor */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-xs text-[#2D1B1B] uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#8C3A4F]" />
                            <span>The 3 Ritual Steps (Routine Breakdown)</span>
                          </span>
                        </div>

                        <div className="space-y-3">
                          {comboSteps.map((stepItem, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3.5 bg-white border border-[#EAC9D1] rounded-2xl shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="w-7 h-7 rounded-lg bg-[#FDF0F4] text-[#8C3A4F] font-bold text-xs flex items-center justify-center border border-[#EAC9D1] font-mono shrink-0">
                                  {stepItem.step || `0${sIdx + 1}`}
                                </span>
                                <input
                                  type="text"
                                  value={stepItem.title}
                                  onChange={(e) => {
                                    const next = [...comboSteps];
                                    next[sIdx].title = e.target.value;
                                    setComboSteps(next);
                                  }}
                                  placeholder="Step Title (e.g. 21 Herbs Fusion Hair Oil)"
                                  className="flex-1 px-3 py-1.5 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 font-bold"
                                />
                                <input
                                  type="text"
                                  value={stepItem.tag}
                                  onChange={(e) => {
                                    const next = [...comboSteps];
                                    next[sIdx].tag = e.target.value;
                                    setComboSteps(next);
                                  }}
                                  placeholder="Tag (e.g. Pre-Wash Care)"
                                  className="w-28 px-2.5 py-1.5 text-[11px] bg-rose-50 text-[#8C3A4F] border border-[#EAC9D1] rounded-xl outline-hidden font-semibold"
                                />
                              </div>
                              <textarea
                                rows={2}
                                value={stepItem.desc}
                                onChange={(e) => {
                                  const next = [...comboSteps];
                                  next[sIdx].desc = e.target.value;
                                  setComboSteps(next);
                                }}
                                placeholder="Describe the benefit or action of this step..."
                                className="w-full px-3 py-1.5 text-xs bg-[#FCF8F9] border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIVE PREVIEW */}
                  {comboActiveTab === 'preview' && (
                    <div className="p-4 sm:p-6 bg-[#FCF8F9] rounded-2xl border border-[#EAC9D1] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {/* Image Preview */}
                        <div className="md:col-span-5 relative aspect-4/3 rounded-2xl overflow-hidden border border-stone-300 shadow-md">
                          <Image
                            src={comboImage}
                            alt={comboHeading}
                            fill
                            className="object-cover"
                          />
                          {comboImageTag && (
                            <div className="absolute top-2 left-2 bg-[#8C3A4F] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              {comboImageTag}
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 text-white">
                            <p className="text-[10px] font-bold text-amber-300 uppercase">{comboOverlayTitle}</p>
                            <p className="text-[9px] text-rose-100">{comboOverlaySubtitle}</p>
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className="md:col-span-7 space-y-2.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C3A4F] bg-rose-100 px-2 py-0.5 rounded-full inline-block">
                            {comboBadge}
                          </span>
                          <h4 className="text-lg font-extrabold text-stone-900 font-serif leading-tight">
                            {comboHeading}
                          </h4>
                          <p className="text-[10px] font-bold text-[#8C3A4F] uppercase">{comboSubtitle}</p>

                          {/* Price Box Preview */}
                          <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-stone-500 uppercase block font-semibold">
                                Combo Special Price
                              </span>
                              <div className="flex items-baseline gap-1.5 font-sans">
                                <span className="text-xl font-extrabold text-stone-900 tabular-nums">
                                  ₹{Number(comboSalePrice).toLocaleString('en-IN')}
                                </span>
                                {Number(comboRegularPrice) > Number(comboSalePrice) && (
                                  <span className="text-xs font-semibold text-stone-400 line-through tabular-nums">
                                    ₹{Number(comboRegularPrice).toLocaleString('en-IN')}
                                  </span>
                                )}
                                <span className="text-[9px] font-bold text-[#8C3A4F] bg-rose-100 px-1.5 py-0.5 rounded-xs">
                                  {comboSaveText}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {comboDeliveryBadge}
                            </span>
                          </div>

                          {/* 3 Steps summary */}
                          <div className="space-y-1.5">
                            {comboSteps.map((st, i) => (
                              <div key={i} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-stone-100 text-[10px]">
                                <span className="w-5 h-5 rounded-sm bg-rose-100 text-[#8C3A4F] font-bold flex items-center justify-center font-mono">
                                  {st.step}
                                </span>
                                <span className="font-bold text-stone-800 truncate flex-1">{st.title}</span>
                                <span className="text-[9px] bg-rose-50 text-[#8C3A4F] px-1 rounded-xs">{st.tag}</span>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                            <div className="py-2 bg-[#8C3A4F] text-white rounded-xl text-center text-[10px] font-bold">
                              BUY NOW • ₹{Number(comboSalePrice).toLocaleString('en-IN')}
                            </div>
                            <div className="py-2 bg-rose-50 text-[#8C3A4F] border border-[#EAC9D1] rounded-xl text-center text-[10px] font-bold">
                              ADD TO BAG
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-Hero Generic Raw JSON Editor */
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
