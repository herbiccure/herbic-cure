'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Phone,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  LogOut,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  logoUrl?: string;
  brandName?: string;
  whatsappNumber?: string;
}

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  salePrice: number;
  regularPrice: number;
  images: { url: string }[];
}

export default function Header({
  logoUrl = '/images/banners/herbic-cure-logo.png',
  brandName = 'Herbic Cure',
  whatsappNumber = '918121961219',
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const { customer, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [desktopSearchFocused, setDesktopSearchFocused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  // Taskbar Offers link visibility setting (defaults to false / OFF)
  const [navbarOffersEnabled, setNavbarOffersEnabled] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const [currentLogoUrl, setCurrentLogoUrl] = useState(logoUrl);
  const [currentBrandName, setCurrentBrandName] = useState(brandName);

  useEffect(() => {
    if (logoUrl) setCurrentLogoUrl(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    if (brandName) setCurrentBrandName(brandName);
  }, [brandName]);

  // Fetch navigation settings and brand identity from CMS
  useEffect(() => {
    let isMounted = true;
    fetch('/api/navigation')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (typeof data?.navbarOffersEnabled === 'boolean') {
          setNavbarOffersEnabled(data.navbarOffersEnabled);
        }
        if (data?.logoUrl) {
          setCurrentLogoUrl(data.logoUrl);
        }
        if (data?.brandName) {
          setCurrentBrandName(data.brandName);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setDesktopSearchFocused(false);
    setAccountDropdownOpen(false);
  }, [pathname]);

  // Handle scroll state with hysteresis & RAF throttling to eliminate jitter and scroll-up lag
  useEffect(() => {
    let ticking = false;

    const updateScrollState = () => {
      const y = window.scrollY;
      setIsScrolled((prev) => {
        // Hysteresis deadband:
        // Must scroll down past 120px to enter floating mode
        if (!prev && y > 120) return true;
        // Must scroll all the way back up above 30px to return to expanded top mode
        if (prev && y < 30) return false;
        return prev;
      });
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside listener for desktop search & account dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setDesktopSearchFocused(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setDesktopSearchFocused(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    {
      label: 'Best Sellers',
      href: '/collections/best-sellers',
      badge: 'HOT',
    },
    { label: 'All Products', href: '/products' },
    { label: '21 Herbs', href: '/ingredients' },
    { label: 'Results', href: '/results' },
    { label: 'How to Use', href: '/how-to-use' },
    ...(navbarOffersEnabled
      ? [
          {
            label: 'Offers',
            href: '/offers',
            badge: 'SALE',
          },
        ]
      : []),
    { label: 'About', href: '/about' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-stone-200/80'
            : 'bg-white border-b border-stone-200/60'
        }`}
      >
        {/* ========================================================= */}
        {/* DESKTOP HEADER (lg and up)                                */}
        {/* ========================================================= */}
        <div className="hidden lg:block w-full">
          {/* TIER 1: BRAND, SEARCH & UTILITIES BAR */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`flex items-center justify-between transition-all duration-300 ${
                isScrolled ? 'h-16' : 'h-20'
              }`}
            >
              {/* LEFT: Live Search Bar (or condensed logo when scrolled) */}
              <div className="flex-1 max-w-sm" ref={searchBoxRef}>
                {isScrolled ? (
                  /* Compact logo on left when scrolled */
                  <Link href="/" className="inline-flex items-center group">
                    <div className="relative w-36 h-10 flex items-center">
                      <Image
                        src={currentLogoUrl}
                        alt={currentBrandName}
                        width={144}
                        height={40}
                        className="object-contain object-left max-h-10"
                        priority
                      />
                    </div>
                  </Link>
                ) : (
                  /* Full live search bar when at top */
                  <div className="relative">
                    <form onSubmit={handleSearchSubmit} className="relative">
                      <input
                        type="text"
                        placeholder="Search hair oils, combos, 21 herbs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setDesktopSearchFocused(true)}
                        className="w-full bg-stone-50 hover:bg-stone-100/80 focus:bg-white text-xs lg:text-[13px] text-stone-800 placeholder-stone-400 border border-stone-200 focus:border-[#A84358] rounded-full pl-10 pr-10 py-2.5 transition-all duration-200 outline-none shadow-inner"
                      />
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </form>

                    {/* Instant Search Suggestions Dropdown */}
                    {desktopSearchFocused && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 z-50 animate-fadeIn">
                        {searchResults.length > 0 ? (
                          <div>
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                              <span>Matching Products</span>
                              <span className="text-rose-700">{searchResults.length} found</span>
                            </div>
                            <div className="space-y-2">
                              {searchResults.map((prod) => (
                                <Link
                                  key={prod.id}
                                  href={`/products/${prod.slug}`}
                                  onClick={() => setDesktopSearchFocused(false)}
                                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors group"
                                >
                                  {prod.images?.[0]?.url ? (
                                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                                      <Image
                                        src={prod.images[0].url}
                                        alt={prod.name}
                                        fill
                                        sizes="44px"
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 rounded-lg bg-rose-50 flex items-center justify-center text-rose-800 shrink-0">
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-stone-800 truncate group-hover:text-[#A84358]">
                                      {prod.name}
                                    </p>
                                    <p className="text-[11px] font-bold text-[#A84358]">
                                      ₹{prod.salePrice}{' '}
                                      {prod.regularPrice > prod.salePrice && (
                                        <span className="text-stone-400 line-through font-normal ml-1">
                                          ₹{prod.regularPrice}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#A84358] group-hover:translate-x-0.5 transition-all" />
                                </Link>
                              ))}
                            </div>
                            <Link
                              href={`/products?search=${encodeURIComponent(searchQuery)}`}
                              onClick={() => setDesktopSearchFocused(false)}
                              className="mt-3 block text-center py-2 text-xs font-bold text-[#A84358] bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                            >
                              View all results for &ldquo;{searchQuery}&rdquo; →
                            </Link>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                              <span>Trending Searches</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                '21 Herbs Hair Oil',
                                'Healthy Hair Trio',
                                'Neem Wooden Comb',
                                'Scalp Massager',
                                'Anti Hair Fall',
                                'Biotin Combo',
                              ].map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(term);
                                    router.push(`/products?search=${encodeURIComponent(term)}`);
                                    setDesktopSearchFocused(false);
                                  }}
                                  className="text-xs bg-stone-100 hover:bg-rose-50 hover:text-[#A84358] text-stone-600 px-3 py-1.5 rounded-full transition-colors font-medium"
                                >
                                  {term}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CENTER: Prominent Centered Brand Logo (when at top) OR Centered Nav (when scrolled) */}
              {isScrolled ? (
                /* Condensed Nav Links when scrolled */
                <nav className="flex items-center gap-5 xl:gap-7 text-xs xl:text-[13px] font-bold tracking-wider uppercase text-stone-700">
                  <Link href="/" className="hover:text-[#A84358] transition-colors py-1">
                    Home
                  </Link>
                  <Link
                    href="/collections/best-sellers"
                    className="text-[#A84358] hover:text-rose-900 transition-colors py-1 flex items-center gap-1"
                  >
                    <span>Best Sellers</span>
                    <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                      HOT
                    </span>
                  </Link>
                  <Link href="/products" className="hover:text-[#A84358] transition-colors py-1">
                    Products
                  </Link>
                  <Link href="/how-to-use" className="hover:text-[#A84358] transition-colors py-1">
                    How to Use
                  </Link>
                  <Link href="/ingredients" className="hover:text-[#A84358] transition-colors py-1">
                    21 Herbs
                  </Link>
                  <Link href="/results" className="hover:text-[#A84358] transition-colors py-1">
                    Results
                  </Link>
                  {navbarOffersEnabled && (
                    <Link
                      href="/offers"
                      className="text-amber-700 hover:text-amber-800 transition-colors py-1 font-bold"
                    >
                      Offers
                    </Link>
                  )}
                </nav>
              ) : (
                /* Beautiful Centered Logo when at top of page */
                <div className="flex items-center justify-center">
                  <Link href="/" className="flex items-center group">
                    <div className="relative w-44 xl:w-52 h-12 xl:h-14 flex items-center justify-center">
                      <Image
                        src={currentLogoUrl}
                        alt={currentBrandName}
                        width={208}
                        height={56}
                        className="object-contain max-h-14 group-hover:scale-[1.02] transition-transform"
                        priority
                      />
                    </div>
                  </Link>
                </div>
              )}

              {/* RIGHT: Quick Utilities (WhatsApp Help, Account, Cart) */}
              <div className="flex-1 flex items-center justify-end gap-3 xl:gap-4">
                {/* Search Icon button when scrolled */}
                {isScrolled && (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="p-2 text-stone-600 hover:text-[#A84358] hover:bg-stone-100 rounded-full transition-colors"
                    title="Search catalog"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}

                {/* WhatsApp Ayurvedic Expert Pill */}
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    'Namaste Herbic Cure! I would like Ayurvedic guidance to select the right hair oil routine.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden xl:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-[#A84358] border border-rose-200/80 text-xs font-bold transition-all shadow-xs group"
                  title="Chat directly with our Ayurvedic Hair Specialist"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
                  </span>
                  <Phone className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]" />
                  <span>Ayurvedic Expert</span>
                </a>

                {/* Account / Login Dropdown */}
                <div className="relative" ref={accountDropdownRef}>
                  {customer ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                        className="flex items-center gap-1.5 p-2 text-stone-700 hover:text-[#A84358] hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
                        title={`Account (${customer.name})`}
                      >
                        <div className="w-6 h-6 rounded-full bg-rose-100 text-[#A84358] flex items-center justify-center text-xs font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden xl:inline text-xs font-bold text-rose-900 max-w-[90px] truncate">
                          {customer.name.split(' ')[0]}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 hidden xl:inline transition-transform duration-200 ${accountDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Logged in Account Popup */}
                      {accountDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-fadeIn">
                          <div className="px-4 py-2 border-b border-stone-100">
                            <p className="text-xs font-bold text-stone-900 truncate">{customer.name}</p>
                            <p className="text-[11px] text-stone-500 truncate">{customer.email}</p>
                          </div>
                          <Link
                            href="/account"
                            onClick={() => setAccountDropdownOpen(false)}
                            className="block px-4 py-2 text-xs font-medium text-stone-700 hover:bg-rose-50 hover:text-[#A84358]"
                          >
                            My Dashboard & Orders
                          </Link>
                          <Link
                            href="/track-order"
                            onClick={() => setAccountDropdownOpen(false)}
                            className="block px-4 py-2 text-xs font-medium text-stone-700 hover:bg-rose-50 hover:text-[#A84358]"
                          >
                            Track an Order
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              logout();
                              setAccountDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="relative group">
                      <Link
                        href="/account/login"
                        className="flex items-center gap-1.5 p-2 text-stone-700 hover:text-[#A84358] hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
                        title="Sign In / Register"
                      >
                        <User className="w-5 h-5 text-stone-700 group-hover:text-[#A84358]" />
                        <span className="hidden xl:inline text-xs font-semibold text-stone-600 group-hover:text-[#A84358]">
                          Sign In
                        </span>
                      </Link>

                      {/* Desktop Hover / Quick Dropdown */}
                      <div className="hidden group-hover:block absolute right-0 top-full pt-2 w-56 z-50 animate-fadeIn pointer-events-none group-hover:pointer-events-auto">
                        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-3 space-y-2">
                          <div className="border-b border-stone-100 pb-2">
                            <p className="text-xs font-bold text-stone-900">Welcome to Herbic Cure</p>
                            <p className="text-[11px] text-stone-500">Access orders & fast checkout</p>
                          </div>
                          <Link
                            href="/account/login"
                            className="block w-full py-2 px-3 text-center rounded-xl bg-[#A84358] hover:bg-[#45363B] text-white text-xs font-bold transition-all shadow-xs"
                          >
                            Sign In
                          </Link>
                          <div className="pt-1 flex flex-col gap-1 text-[11px]">
                            <div className="text-stone-500 text-center">
                              New customer?{' '}
                              <Link
                                href="/account/register"
                                className="text-[#A84358] font-bold hover:underline"
                              >
                                Register here
                              </Link>
                            </div>
                            <Link
                              href="/track-order"
                              className="text-stone-600 hover:text-[#A84358] py-1 text-center font-medium hover:bg-stone-50 rounded"
                            >
                              Track Guest Order
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Shopping Bag / Cart Trigger */}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50/70 hover:bg-rose-100/90 text-[#A84358] border border-rose-200/60 transition-all cursor-pointer group"
                  aria-label="Open Cart Drawer"
                >
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5 text-[#A84358] group-hover:scale-110 transition-transform" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-[#A84358] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold tracking-tight">
                    {itemCount > 0 ? `₹${subtotal}` : 'Bag'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* TIER 2: PRIMARY NAVIGATION BAR (Smoothly transitions on scroll without layout jitter) */}
          <div
            className={`border-t border-stone-200/70 bg-[#FCF8F9]/90 backdrop-blur-xs transition-all duration-300 ease-in-out overflow-hidden ${
              isScrolled
                ? 'max-h-0 opacity-0 pointer-events-none'
                : 'max-h-14 opacity-100'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex items-center justify-center gap-3 sm:gap-5 lg:gap-7 xl:gap-9 h-11 text-xs lg:text-[13px] font-bold tracking-wider uppercase text-stone-700">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`relative group/link py-1 transition-colors flex items-center gap-1.5 ${
                        pathname === link.href
                          ? 'text-[#A84358]'
                          : 'hover:text-[#A84358]'
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold tracking-tight ${
                            link.badge === 'HOT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-[#A84358]'
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                      {pathname === link.href && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#A84358] rounded-full" />
                      )}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE & TABLET HEADER (< lg)                             */}
        {/* ========================================================= */}
        <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left: Hamburger & Search Icon */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 -ml-2 text-stone-700 hover:text-[#A84358] active:text-[#A84358] rounded-lg touch-manipulation cursor-pointer select-none active:scale-90 transition-transform"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSearchOpen(true)}
                className="p-2 text-stone-600 hover:text-[#A84358] active:text-[#A84358] rounded-lg touch-manipulation cursor-pointer select-none active:scale-90 transition-transform"
                aria-label="Open search dialog"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Center: Brand Logo */}
            <div className="flex items-center justify-center">
              <Link href="/" className="flex items-center">
                <div className="relative w-32 sm:w-40 h-10 sm:h-12 flex items-center">
                  <Image
                    src={currentLogoUrl}
                    alt={currentBrandName}
                    width={160}
                    height={48}
                    className="object-contain max-h-11"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Right: WhatsApp, Account, Cart */}
            <div className="flex items-center gap-1 sm:gap-2">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-rose-700 hover:text-rose-800"
                title="WhatsApp Support"
              >
                <Phone className="w-5 h-5 text-[#25D366] fill-[#25D366]" />
              </a>

              <Link
                href={customer ? '/account' : '/account/login'}
                className="p-2 text-stone-700 hover:text-[#A84358]"
                title="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-stone-700 hover:text-[#A84358] relative"
                aria-label="Open Shopping Bag"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#A84358] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE / EXPANDABLE SEARCH OVERLAY MODAL                  */}
        {/* ========================================================= */}
        {searchOpen && (
          <div className="absolute top-0 inset-x-0 bg-white shadow-2xl border-b border-stone-200 p-4 sm:p-6 z-50 animate-fadeIn">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Search Herbic Cure Products & Herbs
                </span>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search hair oils, wooden combs, kits, biotin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full text-base sm:text-lg border-2 border-[#A84358] rounded-xl pl-12 pr-24 py-3.5 focus:outline-none"
                />
                <Search className="w-6 h-6 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#A84358] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#45363B] transition-colors"
                >
                  Search
                </button>
              </form>

              {/* Suggestions */}
              <div className="mt-4">
                <p className="text-xs font-bold text-stone-500 mb-2">Popular Searches:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    '21 Herbs Hair Oil',
                    'Wooden Comb',
                    'Scalp Massager',
                    'Healthy Hair Trio',
                    'Combos',
                  ].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        router.push(`/products?search=${encodeURIComponent(term)}`);
                        setSearchOpen(false);
                      }}
                      className="bg-stone-100 hover:bg-rose-50 hover:text-[#A84358] px-3 py-1.5 rounded-full font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MOBILE NAVIGATION DRAWER                                 */}
        {/* ========================================================= */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-100 bg-white py-4 px-6 space-y-4 animate-fadeIn max-h-[85vh] overflow-y-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm border border-stone-300 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#A84358]"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <div className="divide-y divide-stone-100 text-sm font-semibold text-stone-800">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 hover:text-[#A84358]"
              >
                Home
              </Link>
              <Link
                href="/collections/best-sellers"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-[#A84358] flex items-center justify-between"
              >
                <span>Best Sellers</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">
                  HOT
                </span>
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 hover:text-[#A84358]"
              >
                All Products
              </Link>

              

              <Link
                href="/ingredients"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 hover:text-[#A84358]"
              >
                21 Ayurvedic Herbs Directory
              </Link>
              <Link
                href="/results"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 hover:text-[#A84358]"
              >
                Clinical Results (Before/After)
              </Link>
              <Link
                href="/how-to-use"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 hover:text-[#A84358]"
              >
                How to Use & Hair Guides
              </Link>
              {navbarOffersEnabled && (
                <Link
                  href="/offers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-amber-700 font-bold"
                >
                  Special Offers & Combos
                </Link>
              )}
              <Link
                href="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 hover:text-[#A84358]"
              >
                Track Your Order
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 hover:text-[#A84358]"
              >
                About Herbic Cure
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 hover:text-[#A84358]"
              >
                Contact Us
              </Link>
            </div>

            {/* Quick Action CTAs */}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={customer ? '/account' : '/account/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                {customer ? 'My Account & Orders' : 'Sign In / Register'}
              </Link>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 text-center bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#20ba59] flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 fill-white" />
                <span>Chat with Ayurvedic Expert</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
