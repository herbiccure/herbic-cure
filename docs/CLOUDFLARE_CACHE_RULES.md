# Cloudflare CDN Caching Architecture & Page Rules
**Herbic Cure (Ayurvedic E-Commerce Platform)**

## 1. Zero Private / Money Cache Policy
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

## 2. Public Static & Product Caching
- **Rule 5: Static Assets (`/_next/static/*`, `/images/*`)**
  - Edge Cache TTL: **1 Month (2,592,000s)**
  - Browser Cache TTL: **1 Year (31,536,000s)**
  - Cache Level: Cache Everything
- **Rule 6: Public Storefront (`/products/*`, `/categories/*`, `/`)**
  - Edge Cache TTL: **2 Hours (7,200s)**
  - Cache Level: Cache Everything (Respect Origin Cache-Control)
  - Purged via Next.js `revalidateTag()` on admin product/category update.
