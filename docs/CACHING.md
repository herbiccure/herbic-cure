# Herbic Cure Caching Architecture & Invalidation Protocol

## Multi-Layer Caching Design

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
