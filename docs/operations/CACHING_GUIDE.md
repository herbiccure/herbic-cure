# Herbic Cure Caching Architecture & Cloudflare Invalidation Guide

## 1. Multi-Layer Caching Design

### Layer 1: Edge CDN (Cloudflare)
- **Public Allowlist**: Static assets (`/_next/static/*`, `/images/*`) cached with `max-age=31536000, immutable`.
- **Zero-Cache Rule**: All private, financial, and admin routes (`/admin/*`, `/account/*`, `/api/orders/*`, `/api/payment/*`, `/api/auth/*`) enforce:
  ```http
  Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate, proxy-revalidate
  Pragma: no-cache
  Expires: 0
  Surrogate-Control: no-store
  ```
  This guarantees that no user's private session, stale inventory price at checkout, or revoked staff permission is ever cached at the edge.

### Layer 2: Next.js Data Cache
- Public catalog queries in `src/data/public/products.ts` use `unstable_cache` tagged with:
  - `'products'`
  - `'product-${slug}'`
  - `'categories'`
  - `'homepage'`

### Layer 3: Application Memory & Upstash Redis
- Distributed single-flight lock (`src/lib/cache/lock.ts`) using `SET key val NX PX 5000` prevents double-redemption of coupons and concurrent inventory overselling.
- Transparent memory-backed fallback ensures local developer workstations run without external cloud credentials.

### Layer 4: Tag-Based On-Demand Invalidation
When an administrator edits a product, category, or promotional banner:
- `invalidateProductCache(slug)`
- `invalidateCategoryCache(slug)`
- `invalidateHomepageCache()`
These call `revalidateTag(tag, { expire: 0 })` and `revalidatePath()`, immediately flushing origin and edge caches.

---

## 2. Cloudflare CDN Page Rules & Routing Configuration

### A. Zero Private / Money Cache Policy
To prevent serving another user's personal data, stale pricing during payment verification, or revoked admin access:
- **Rule 1: Admin Panel (`/admin/*`, `/api/admin/*`)**
  - Edge Cache TTL: **Bypass Cache**
  - Browser Cache TTL: **Bypass Cache**
  - Security Level: High (Turnstile / WAF active)
- **Rule 2: Customer Account (`/account/*`, `/api/account/*`)**
  - Edge Cache TTL: **Bypass Cache**
  - Browser Cache TTL: **Bypass Cache**
- **Rule 3: Money & Checkout Routes (`/api/orders/*`, `/api/payment/*`)**
  - Edge Cache TTL: **Bypass Cache**
  - Always Online: Off
- **Rule 4: Authentication Routes (`/api/auth/*`)**
  - Edge Cache TTL: **Bypass Cache**

### B. Public Static & Product Caching
- **Rule 5: Static Assets (`/_next/static/*`, `/images/*`)**
  - Edge Cache TTL: **1 Month (2,592,000s)**
  - Browser Cache TTL: **1 Year (31,536,000s)**
  - Cache Level: Cache Everything
- **Rule 6: Public Storefront (`/products/*`, `/categories/*`, `/`)**
  - Edge Cache TTL: **2 Hours (7,200s)**
  - Cache Level: Cache Everything (Respect Origin Cache-Control)
  - Purged via Next.js `revalidateTag()` on admin product/category update.
