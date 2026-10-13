# Herbic Cure - Ayurvedic Hair Care E-Commerce

A modern, high-performance e-commerce storefront for **Herbic Cure**, handcrafted with authentic South Indian 21 Herbs Kshirapak Vidhi formulations.

## 🌿 Highlights & Features

- **Full Catalog & Regimens**: 21 Herbs Fusion Hair Oils (Q1 100ml, Q2 200ml, Q3 300ml), Handcrafted Neem Wood Combs, 2-in-1 Daily Cleansing Shampoo with Conditioner, and complete therapy kits.
- **Dynamic Tiered Pricing**: Structured discounts (33% max on Single Oil, and 20%, 18%, 16%, 14% on combos and accessories).
- **Urgency Countdown Timer**: Real-time rolling session countdown timers on product cards and product detail pages (`Offer ends in <time>`).
- **Silky Smooth Sticky Header**: Hysteresis-buffered, RAF-throttled scroll handler that eliminates layout jitter and lag on scroll-up.
- **Organic Botanical Footer**: Custom organic SVG wave transition, warm herbal blush palette, floating newsletter card, and floating animated social icons.
- **Live WhatsApp Ayurvedic Consultation**: Floating widget with pulse ripple and prefilled support routing.
- **Interactive Cart & Checkout**: Slide-out drawer, coupon validation (`HERBIC10`), COD and Online payment options, and order tracking.
- **Database-Driven CMS**: Prisma ORM with SQLite backend for products, customer before/after transformations, reviews, and FAQs.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/WaqarTabish2807/herbicCure.git
cd herbicCure
npm install
```

### 3. Database Setup & Seeding
```bash
# Push schema to SQLite
npx prisma db push

# Seed products, reviews, FAQs, and categories
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the storefront.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) with custom botanical tokens & animations
- **Database & ORM**: [Prisma](https://www.prisma.io) with SQLite
- **Icons**: [Lucide React](https://lucide.dev)
- **Language**: TypeScript

---

© Herbic Cure. All Rights Reserved.
