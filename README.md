# Herbic Cure — Authentic Ayurvedic E-Commerce Storefront

A modern, high-performance e-commerce platform for **Herbic Cure**, handcrafted with authentic South Indian 21 Herbs Kshirapak Vidhi formulations. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and Supabase PostgreSQL.

---

## Features & Architecture

### Catalog & Shopping Experience
- **Authentic Formulations**: 21 Herbs Fusion Hair Oils (Q1 100ml, Q2 200ml, Q3 300ml), Handcrafted Neem Wood Combs, 2-in-1 Daily Cleansing Shampoo with Conditioner, and complete therapy kits.
- **Dynamic Tiered Pricing**: Structured discounts across single oils, regimens, combos, and accessories.
- **Urgency Rolling Countdown Timer**: Real-time rolling session countdown timers on product cards and product detail pages.
- **Silky Smooth Sticky Header**: Hysteresis-buffered, RAF-throttled scroll handler that eliminates layout jitter on scroll-up.
- **Organic Botanical Footer**: Custom organic SVG wave transition, warm herbal blush palette, floating newsletter card, and social links.
- **Live WhatsApp Ayurvedic Consultation**: Floating widget with pulse ripple and prefilled support routing.

### Verified Purchaser Reviews
- **Authentication Protected**: Only logged-in customers can submit reviews.
- **Verified Purchase Requirement**: The review submission API verifies that the authenticated user has purchased the formulation before accepting and publishing the review.
- **Live Aggregates**: Displays overall rating, star distribution bars, and Verified Buyer badges on product detail pages.

### Secure Checkout Pipeline
- **Mandatory Account Authentication**: Unauthenticated visitors are prompted to sign in or create an account, protecting order tracking and verified review eligibility.
- **Preserved Cart**: Shopping bag state is safely retained when redirecting through the login or registration flow.
- **Doorstep Tracking**: Pre-filled verified customer credentials with automated tracking generation (Shiprocket).

### Enterprise Identity & Security
- **RBAC Roles**: Hierarchical roles (`OWNER`, `MANAGER`, `SUPPORT`, `CUSTOMER`) powered by Better Auth and Prisma.
- **Rate Limiting**: Layered IP rate limiting on authentication and checkout creation endpoints.
- **Zod Validation**: Strict schema validation on checkout, reviews, and authentication.

### Technical SEO & Performance
- **Dynamic XML Sitemap**: Generated on the fly with canonical public URLs.
- **Automated 301 Redirect Engine**: Prevents redirect loops, flattens multi-hop chains, and tracks slug changes.
- **Zero Orphan Pages**: Fully connected internal link graph verified through automated testing.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **ORM**: [Prisma](https://www.prisma.io)
- **Authentication**: [Better Auth](https://better-auth.com)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Testing**: [Vitest](https://vitest.dev)
- **Language**: TypeScript

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Supabase Account**: With PostgreSQL connection URI

### 2. Installation
```bash
git clone https://github.com/herbiccure/herbic-cure.git
cd herbic-cure
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
BETTER_AUTH_SECRET="your-secure-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup & Seeding
```bash
# Sync database schema with Supabase
npm run db:push

# Seed catalog, ingredients, collections, coupons, and sample data
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the storefront.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm test` | Run test suite with Vitest |
| `npm run typecheck` | Run TypeScript strict type verification |
| `npm run db:push` | Push Prisma schema directly to database |
| `npm run db:seed` | Seed catalog, ingredients, and initial site settings |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## Documentation

Full architectural specifications, operational runbooks, security audits, and developer guides are organized under the [`/docs`](file:///d:/Codes/Projects/herbicCure-main/docs/INDEX.md) directory. See the [Documentation Index](file:///d:/Codes/Projects/herbicCure-main/docs/INDEX.md) for a categorized guide.

---

© Herbic Cure. All Rights Reserved.
