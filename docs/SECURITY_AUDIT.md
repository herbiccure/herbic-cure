# SECURITY AUDIT REPORT: HERBIC CURE E-COMMERCE APPLICATION

**Application:** Herbic Cure (Ayurvedic E-Commerce & Admin CMS)  
**Date:** October 11, 2026  
**Auditor:** Senior Application Security Engineer & Next.js Core Specialist  
**Status:** Audit Complete — Pending Approval Before Phase 1 Code Remediation  

---

## 1. Executive Summary

A comprehensive application security audit of the **Herbic Cure** repository was performed covering all route handlers, authentication flows, middleware layers, payment integrations, data access pipelines, client components, and configuration files.

The audit revealed **5 Critical, 8 High, 7 Medium, and 3 Low** severity vulnerabilities. Crucially, multiple core e-commerce protections are currently missing or implemented in an insecure manner:
1. **Unsigned, Forgable Admin Sessions**: The admin session cookie is raw, unencrypted, unsigned JSON with `httpOnly: false`. Any client can forge an admin cookie and obtain immediate full administrator privileges.
2. **Client-Controlled Pricing & Total Amounts**: The checkout endpoint (`/api/orders/create`) trusts client-submitted prices, discounts, subtotal, and total without server-side recalculation against the database.
3. **Payment Verification Bypass**: Orders with online payment methods are immediately marked as `PAID` without verifying Razorpay order creation, payment signatures, or webhook verification.
4. **Complete IDOR / Customer PII Leak**: `/api/orders/user?email=...` has no session authentication and allows any anonymous actor to extract full order history, phone numbers, and physical addresses of any customer.
5. **Zero Server-Side Schema Validation**: Not a single route handler out of 33 API routes enforces Zod schema validation on the server.
6. **No Security Headers & Missing CSRF / Rate Limiting**: Next.js configuration lacks CSP, HSTS, frame-ancestors, and rate-limiting safeguards.

Per the **Rules of Engagement**, **NO CODE HAS BEEN MODIFIED** in this pass. Implementation will proceed phase by phase upon approval.

---

## 2. Vulnerability Severity Matrix

| ID | Title | Severity | Location | Domain |
|---|---|---|---|---|
| **SEC-01** | Unsigned Client-Forgable Admin Session Cookie (Total Auth Bypass) | **CRITICAL** | `src/app/api/admin/login/route.ts:39`, `src/proxy.ts:20` | Auth / Session |
| **SEC-02** | Client-Controlled Prices, Discounts & Totals in Checkout | **CRITICAL** | `src/app/api/orders/create/route.ts:7-30` | Business Logic / Payments |
| **SEC-03** | Instant 'PAID' Status Without Gateway Verification (Razorpay Bypass) | **CRITICAL** | `src/app/api/orders/create/route.ts:29-30` | Payments |
| **SEC-04** | IDOR: Unauthenticated PII & Order Extraction via Email Query | **CRITICAL** | `src/app/api/orders/user/route.ts:14-24` | Authorization / IDOR |
| **SEC-05** | Missing In-Route Authorization Across All Admin Endpoints | **CRITICAL** | `src/app/api/admin/*` (All 21 endpoints) | Authorization |
| **SEC-06** | Insecure Client-Side Only Customer Authentication (localStorage) | **HIGH** | `src/app/api/auth/customer/login/route.ts:31`, `src/context/AuthContext.tsx` | Authentication |
| **SEC-07** | Open Redirect Vulnerability via Admin Login `from` Parameter | **HIGH** | `src/app/admin/login/page.tsx:24-53` | XSS / Open Redirect |
| **SEC-08** | Complete Absence of Server-Side Zod Validation Across All API Routes | **HIGH** | `src/app/api/*` (All 33 routes) | Input Validation |
| **SEC-09** | Missing Security Headers (No CSP, HSTS, Clickjacking, MIME Sniffing) | **HIGH** | `next.config.ts:3-13` | Headers / Network |
| **SEC-10** | Unrestricted Rate Limiting on Auth, Checkout, and Verification | **HIGH** | Entire Application | Abuse / DDoS |
| **SEC-11** | Coupon Concurrency Race Condition & Infinite Redemption | **HIGH** | `src/app/api/coupons/verify/route.ts`, `src/app/api/orders/create/route.ts` | Business Logic |
| **SEC-12** | Missing Inventory Checks & Stock Depletion Race Conditions | **HIGH** | `src/app/api/orders/create/route.ts:32` | Business Logic |
| **SEC-13** | 5 High-Severity Vulnerabilities in npm Dependencies | **HIGH** | `package.json`, `package-lock.json` | Supply Chain |
| **SEC-14** | Unsanitized Rich Text HTML Ingestion via dangerouslySetInnerHTML | **MEDIUM** | `src/app/hair-care-tips/[slug]/page.tsx:77` | XSS |
| **SEC-15** | Hardcoded Demo Credentials & Public Auto-Fill on Admin Portal | **MEDIUM** | `src/app/admin/login/page.tsx:64-68`, `prisma/seed.ts:34` | Authentication |
| **SEC-16** | Media API Accepts Unsanitized Arbitrary URLs | **MEDIUM** | `src/app/api/admin/media/route.ts:14-29` | SSRF / Input Validation |
| **SEC-17** | Prohibited Dark Pattern: Deceptive Rolling Session Countdown Timer | **MEDIUM** | `src/components/ui/OfferCountdownTimer.tsx:24-35` | Business Logic / Legal |
| **SEC-18** | Missing CSRF Protection & Origin Header Validation on Mutations | **MEDIUM** | `src/app/api/*` | CSRF |
| **SEC-19** | Missing Startup Environment Variable Validation | **MEDIUM** | `src/*`, `next.config.ts` | Secrets / Config |
| **SEC-20** | Unprotected Public Submission Forms (Spam / Bot Exhaustion) | **MEDIUM** | `src/app/api/contact/route.ts`, `src/app/api/newsletter/route.ts` | Abuse / Spam |
| **SEC-21** | Admin Order Update Endpoint Returns 405 (Missing PUT Handler) | **LOW** | `src/app/api/admin/orders/[id]/route.ts` | API Correctness |
| **SEC-22** | Admin Routes Lack `X-Robots-Tag: noindex, nofollow` Directives | **LOW** | `src/proxy.ts`, `src/app/admin/*` | Information Disclosure |
| **SEC-23** | Absence of Standard Health Check Endpoint (`/api/health`) | **LOW** | `src/app/api/health` | Monitoring |

---

## 3. Detailed Technical Findings

### SEC-01 [CRITICAL]: Unsigned Client-Forgable Admin Session Cookie (Total Auth Bypass)
- **Files & Lines:** [`src/app/api/admin/login/route.ts:39-46`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/admin/login/route.ts#L39-L46), [`src/proxy.ts:20-31`](file:///d:/Codes/Projects/herbicCure-main/src/proxy.ts#L20-L31)
- **Vulnerability:** When an administrator logs in, the server sets a cookie named `admin_session` containing plaintext JSON: `JSON.stringify({ id, name, email, role })` with `httpOnly: false`. In middleware (`src/proxy.ts`), the system authenticates the user solely by executing `JSON.parse(sessionCookie)` and checking if `parsed.id || parsed.email` exists. There is **no signature, no HMAC, no JWT verification, and no database session lookup**.
- **Attack Scenario:** An anonymous attacker opens browser DevTools or issues `curl` with:
  ```bash
  curl -H "Cookie: admin_session=%7B%22id%22%3A%22attacker%22%2C%22email%22%3A%22admin%40herbiccure.com%22%2C%22role%22%3A%22SUPER_ADMIN%22%7D" http://localhost:3000/admin/orders
  ```
  The proxy middleware evaluates this as authenticated and grants immediate access to all orders, customers, and CMS settings.
- **Proposed Fix (Phase 2):** Implement signed, encrypted sessions via Auth.js / Better Auth or iron-session/jose with `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, strict server-side session store or HMAC-SHA256 signature verification against an environment secret.

---

### SEC-02 [CRITICAL]: Client-Controlled Prices, Discounts & Totals in Checkout
- **Files & Lines:** [`src/app/api/orders/create/route.ts:7-30`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/create/route.ts#L7-L30)
- **Vulnerability:** The `/api/orders/create` endpoint receives `items`, `subtotal`, `discount`, `shippingFee`, and `total` from the incoming request body and writes them directly to the database:
  ```typescript
  subtotal: Number(subtotal) || 0,
  discount: Number(discount) || 0,
  total: Number(total) || 0,
  items: { create: items.map(it => ({ price: Number(it.price) || 0, ... })) }
  ```
- **Attack Scenario:** An attacker intercepts the checkout request via DevTools or Burp Suite and modifies the body to:
  ```json
  { "items": [{"id": "herbic-cure-oil-q1", "price": 1, "quantity": 10}], "subtotal": 10, "discount": 9, "total": 1, "paymentMethod": "COD" }
  ```
  The database creates a confirmed order for 10 units at ₹1 total, bypassing all actual inventory pricing.
- **Proposed Fix (Phase 5):** The server must never trust client-sent prices, discounts, or totals. The server must load each item by its ID from Prisma, retrieve its authoritative `salePrice`, verify stock, calculate the cart total, independently revalidate and calculate any active coupon discount, apply tax/shipping rules, and compute the final payable amount on the server.

---

### SEC-03 [CRITICAL]: Payment Verification Bypass: Auto-Marking Orders as 'PAID'
- **Files & Lines:** [`src/app/api/orders/create/route.ts:29-30`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/create/route.ts#L29-L30)
- **Vulnerability:** The order creation route contains:
  ```typescript
  paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID'
  ```
  If the client specifies `paymentMethod: 'ONLINE'` or `'RAZORPAY'`, the order is immediately created with `paymentStatus: 'PAID'` without any interaction with Razorpay, without order token creation, and without signature verification.
- **Attack Scenario:** Any buyer can purchase unlimited products online for free by selecting online payment; the system marks their order as `CONFIRMED` and `PAID`, dispatching it to fulfillment without any money captured.
- **Proposed Fix (Phase 5):** Online orders must be created in `PENDING` status. The server must initialize a server-to-server Razorpay order (`razorpay.orders.create`). Once paid, Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The server must verify the HMAC-SHA256 signature using `crypto.timingSafeEqual`. Webhooks with secret verification must be the single source of truth for payment reconciliation.

---

### SEC-04 [CRITICAL]: IDOR & Unauthenticated Sensitive PII / Order Data Leakage
- **Files & Lines:** [`src/app/api/orders/user/route.ts:14-24`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/user/route.ts#L14-L24)
- **Vulnerability:**
  ```typescript
  export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const orders = await prisma.order.findMany({ where: { customerEmail: email } });
    return NextResponse.json({ orders });
  }
  ```
- **Attack Scenario:** An unauthenticated attacker accesses:
  ```text
  GET /api/orders/user?email=priya.sharma@example.com
  ```
  The endpoint returns all past orders including full customer names, phone numbers, delivery addresses, and tracking numbers. By enumerating email addresses or scraping subscriber lists, all customer PII can be harvested.
- **Proposed Fix (Phase 2):** Require authenticated customer session cookies. Extract the customer ID and email directly from the verified session context, not from unauthenticated query parameters (`where: { customerId: session.user.id }`).

---

### SEC-05 [CRITICAL]: Missing In-Route Authorization Across All Admin Endpoints
- **Files & Lines:** [`src/app/api/admin/*`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/admin) (21 route files)
- **Vulnerability:** Not a single handler in `/api/admin/` checks authorization internally. They rely solely on the Next.js middleware file `src/proxy.ts`. In Next.js, relying exclusively on middleware for security has suffered from route matcher bypasses (e.g. CVE-2024-34351 and header-based matcher anomalies).
- **Attack Scenario:** If a request reaches the route handler without traversing middleware (or if middleware configuration is altered/bypassed), all admin APIs (creating coupons, deleting products, changing store settings) execute without authentication.
- **Proposed Fix (Phase 2):** Implement a centralized `requireRole(['OWNER', 'STAFF'])` helper that is called at the beginning of every admin Server Action and route handler to enforce defense-in-depth.

---

### SEC-06 [HIGH]: Insecure Client-Side Customer Authentication Architecture
- **Files & Lines:** [`src/app/api/auth/customer/login/route.ts:31-40`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/auth/customer/login/route.ts#L31-L40), [`src/context/AuthContext.tsx:28-35`](file:///d:/Codes/Projects/herbicCure-main/src/context/AuthContext.tsx#L28-L35)
- **Vulnerability:** Customer login simply returns a customer JSON object which is stored in `localStorage.getItem('herbic_customer')`. No HTTP-only session cookie is set. `localStorage` is vulnerable to XSS exfiltration and allows any user to spoof their identity on the client side.
- **Proposed Fix (Phase 2):** Migrate customer auth to secure server sessions (Auth.js / Better Auth) using httpOnly, secure, sameSite=lax cookies with session rotation and invalidation.

---

### SEC-07 [HIGH]: Open Redirect Vulnerability in Admin Login
- **Files & Lines:** [`src/app/admin/login/page.tsx:24`](file:///d:/Codes/Projects/herbicCure-main/src/app/admin/login/page.tsx#L24), [`src/app/admin/login/page.tsx:53`](file:///d:/Codes/Projects/herbicCure-main/src/app/admin/login/page.tsx#L53)
- **Vulnerability:** `const redirectTo = searchParams.get('from') || '/admin/orders';` followed by `router.push(redirectTo);`.
- **Attack Scenario:** An attacker creates a phishing link:
  `http://localhost:3000/admin/login?from=https://evil-phishing-attacker.com`
  When the administrator logs in, they are redirected to the attacker's external site to harvest 2FA tokens or further credentials.
- **Proposed Fix (Phase 3):** Validate `redirectTo` against an internal path allowlist: verify that `redirectTo` starts with a single `/` and not `//` or external URI schemes (`http:`, `javascript:`).

---

### SEC-08 [HIGH]: Complete Absence of Server-Side Zod Validation
- **Files & Lines:** All 33 routes in [`src/app/api/`](file:///d:/Codes/Projects/herbicCure-main/src/app/api)
- **Vulnerability:** Requests parse bodies via `await req.json()` and access properties directly with `body.property`. No strict schema enforcement exists.
- **Attack Scenario:** Attackers can pass oversized strings, unexpected types causing uncaught server crashes (DoS), negative quantities, and mass-assignment parameters.
- **Proposed Fix (Phase 1):** Create shared Zod schemas with `.strict()` for every route handler and form (checkout, coupons, login, reviews, products, settings) and enforce server-side parse before handling.

---

### SEC-09 [HIGH]: Missing Security Headers & CSP
- **Files & Lines:** [`next.config.ts:3-13`](file:///d:/Codes/Projects/herbicCure-main/next.config.ts#L3-L13)
- **Vulnerability:** No Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options, or Referrer-Policy headers are configured.
- **Attack Scenario:** The application can be embedded in malicious iframes for clickjacking attacks, MIME-type sniffing is unblocked, and script execution is unrestricted.
- **Proposed Fix (Phase 3):** Add security headers in `next.config.ts` or middleware: strict CSP allowing Razorpay and required image domains, HSTS (`max-age=31536000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

---

### SEC-10 [HIGH]: Unrestricted Rate Limiting on Authentication & Checkout
- **Files & Lines:** All API endpoints
- **Vulnerability:** No rate limiting or request throttling exists anywhere in the application.
- **Attack Scenario:** Credential stuffing against `/api/admin/login` and `/api/auth/customer/login`, SMS/OTP spam, COD order bombing against `/api/orders/create`, and coupon brute-forcing at `/api/coupons/verify`.
- **Proposed Fix (Phase 4):** Implement sliding-window rate limiting via `@upstash/ratelimit` (with memory/Redis adapter) applying strict limits on auth (5 req/min), checkout (3 req/min), coupons (10 req/min), and contact/newsletter forms.

---

### SEC-11 [HIGH]: Coupon Concurrency Race Condition & Infinite Redemption
- **Files & Lines:** [`src/app/api/coupons/verify/route.ts:25-30`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/coupons/verify/route.ts#L25-L30), [`src/app/api/orders/create/route.ts`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/create/route.ts)
- **Vulnerability:** `orders/create` never increments `coupon.usedCount` nor guards against concurrent requests.
- **Attack Scenario:** Two concurrent requests using a 1-use coupon can both succeed simultaneously (Time-Of-Check to Time-Of-Use race condition). Furthermore, coupons are currently never marked used upon order completion.
- **Proposed Fix (Phase 5):** Use Prisma database transactions (`prisma.$transaction`) with atomic conditional updates (`updateMany where id = couponId and usedCount < usageLimit`) to prevent concurrent over-redemption.

---

### SEC-12 [HIGH]: Missing Inventory Stock Verification & Depletion Guards
- **Files & Lines:** [`src/app/api/orders/create/route.ts:32-45`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/create/route.ts#L32-L45)
- **Vulnerability:** When orders are created, stock quantities are neither checked nor decremented.
- **Attack Scenario:** Customers can purchase out-of-stock items, or multiple customers can purchase the last remaining item simultaneously, leading to overselling.
- **Proposed Fix (Phase 5):** Verify stock inside a transaction during order creation and atomically decrement `stockQuantity`.

---

### SEC-13 [HIGH]: Vulnerable Dependencies Identified by npm audit
- **Files & Lines:** [`package.json`](file:///d:/Codes/Projects/herbicCure-main/package.json), [`package-lock.json`](file:///d:/Codes/Projects/herbicCure-main/package-lock.json)
- **Vulnerability:** `npm audit` flags 5 High severity vulnerabilities:
  - `micromatch` / `braces` (Regular Expression Denial of Service)
  - `fast-glob`
  - `@next/eslint-plugin-next`
- **Proposed Fix (Phase 6):** Run `npm audit fix` and pin verified, patched versions.

---

### SEC-14 [MEDIUM]: Unsanitized HTML Ingestion via dangerouslySetInnerHTML
- **Files & Lines:** [`src/app/hair-care-tips/[slug]/page.tsx:77`](file:///d:/Codes/Projects/herbicCure-main/src/app/hair-care-tips/[slug]/page.tsx#L77)
- **Vulnerability:**
  ```tsx
  <div dangerouslySetInnerHTML={{ __html: post.content }} />
  ```
- **Attack Scenario:** Stored XSS: if an administrator or compromised account inputs HTML containing `<script>` or `<img onerror=...>`, the script executes in the context of every user visiting that blog post.
- **Proposed Fix (Phase 1 & 3):** Sanitize all rich text using `isomorphic-dompurify` or `sanitize-html` before storage and before rendering.

---

### SEC-15 [MEDIUM]: Hardcoded Demo Credentials & Public Pre-fill on Admin Portal
- **Files & Lines:** [`src/app/admin/login/page.tsx:64-68`](file:///d:/Codes/Projects/herbicCure-main/src/app/admin/login/page.tsx#L64-L68), [`prisma/seed.ts:34-44`](file:///d:/Codes/Projects/herbicCure-main/prisma/seed.ts#L34-L44)
- **Vulnerability:** The public admin login page includes a button labeled `Fill Demo Admin Credentials` that pre-fills `admin@herbiccure.com` and `admin123`. In `prisma/seed.ts`, the default admin password is set to `admin123` with low bcrypt cost (10).
- **Proposed Fix (Phase 2):** Remove demo credentials from production builds, increase bcrypt cost to 12 or use Argon2id, and enforce password change on first login.

---

### SEC-16 [MEDIUM]: Media Endpoint Accepts Unsanitized Arbitrary URLs
- **Files & Lines:** [`src/app/api/admin/media/route.ts:14-29`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/admin/media/route.ts#L14-L29)
- **Vulnerability:** Allows ingestion of arbitrary `url` strings into the database without URL scheme validation (`http/https` only) or domain allowlisting.
- **Proposed Fix (Phase 1):** Validate media URLs using Zod with URL scheme restrictions, and implement proper file upload verification (validating MIME type and magic numbers via `file-type`).

---

### SEC-17 [MEDIUM]: Prohibited Dark Pattern: Deceptive Rolling Session Countdown Timer
- **Files & Lines:** [`src/components/ui/OfferCountdownTimer.tsx:24-35`](file:///d:/Codes/Projects/herbicCure-main/src/components/ui/OfferCountdownTimer.tsx#L24-L35)
- **Vulnerability:** The timer computes a fake rolling 1-hour cycle from `Date.now() % (60 * 60 * 1000)` claiming "Limited introductory price reserved for this session. Ends in 48m". In India, the Central Consumer Protection Authority (CCPA) Guidelines for Prevention of Dark Patterns (2023) classify false urgency timers as unlawful.
- **Proposed Fix (Phase 5):** Replace client-side rolling loop with an authoritative `offerEndsAt` timestamp from the database or promotion schedule that reflects genuine offer validity.

---

### SEC-18 [MEDIUM]: Missing CSRF Protection on State-Mutating Route Handlers
- **Files & Lines:** All POST/PUT/DELETE API route handlers
- **Vulnerability:** No validation of `Origin` or `Host` headers on state-mutating route handlers.
- **Proposed Fix (Phase 3):** Validate `Origin` / `Host` headers against internal domain on state-changing endpoints, and require custom headers or tokens for non-Server Action mutations.

---

### SEC-19 [MEDIUM]: Missing Startup Environment Variable Validation
- **Files & Lines:** Root configuration
- **Vulnerability:** No `.env` schema or startup validation exists. Missing critical environment variables could lead to silent failures or fallback to insecure defaults.
- **Proposed Fix (Phase 1):** Implement strict Zod environment schema (`src/lib/env.ts` or `@t3-oss/env-nextjs`) that validates `DATABASE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SESSION_SECRET`, etc., failing immediately at boot if any are missing.

---

### SEC-20 [MEDIUM]: Unprotected Public Submission Forms
- **Files & Lines:** [`src/app/api/contact/route.ts`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/contact/route.ts), [`src/app/api/newsletter/route.ts`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/newsletter/route.ts), [`src/app/api/reviews/route.ts`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/reviews/route.ts)
- **Vulnerability:** Public submission endpoints have no captcha or bot protection, allowing automated spam bots to flood customer submissions and database tables.
- **Proposed Fix (Phase 4):** Add Cloudflare Turnstile token verification to public forms and rate-limit by IP.

---

### SEC-21 [LOW]: Admin Order Update Endpoint Returns 405 (Missing PUT Handler)
- **Files & Lines:** [`src/app/api/admin/orders/[id]/route.ts`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/admin/orders/[id]/route.ts)
- **Vulnerability:** Admin order management attempts `PUT /api/admin/orders/[id]`, but the route only exports `GET`, causing all admin order status changes to fail.
- **Proposed Fix (Phase 5):** Implement authenticated `PUT` handler validating order state transitions with Zod.

---

### SEC-22 [LOW]: Admin Routes Lack noindex Directives
- **Files & Lines:** [`src/proxy.ts`](file:///d:/Codes/Projects/herbicCure-main/src/proxy.ts), Admin Layout
- **Vulnerability:** Admin login and dashboard views do not return `X-Robots-Tag: noindex, nofollow`, risking search engine indexing of admin login portals.
- **Proposed Fix (Phase 2):** Inject `X-Robots-Tag: noindex, nofollow` headers into all admin responses in middleware and root metadata.

---

### SEC-23 [LOW]: Absence of Standard Health Check Endpoint
- **Files & Lines:** Missing `src/app/api/health/route.ts`
- **Vulnerability:** No non-leaking health check endpoint for uptime monitoring, load balancers, or orchestrators.
- **Proposed Fix (Phase 4):** Create `/api/health` returning `{ status: "ok" }` without exposing internal database or stack traces.

---

## 4. Phased Implementation Roadmap

Once this audit is approved, implementation will execute phase-by-phase with one git commit per phase and full verification (lint, typecheck, tests):

- **Phase 1: Input Validation & Injection Hardening**
  - Create shared Zod schemas (`src/lib/validations/`) with `.strict()` for all forms and route handlers.
  - Implement HTML sanitization with `isomorphic-dompurify`.
  - Implement startup environment validation (`src/lib/env.ts`).
  - Validate uploads and file signatures.
- **Phase 2: Authentication, Authorization & Sessions**
  - Harden session tokens with HMAC/encryption and `httpOnly: true`, `secure: true`.
  - Add in-route `requireRole(['OWNER', 'STAFF', 'SUPPORT'])` authorization.
  - Fix IDOR by scoping customer order queries strictly to session identity.
  - Add admin audit log entries and remove public demo credentials.
  - Inject `X-Robots-Tag: noindex, nofollow` on all admin routes.
- **Phase 3: XSS, CSRF, Security Headers & Open Redirects**
  - Implement strict Content-Security-Policy and security headers in `next.config.ts`.
  - Fix open redirect in admin login with internal path allowlist.
  - Enforce CSRF Origin validation on state-mutating endpoints.
- **Phase 4: Abuse Prevention, Rate Limiting & Denial of Service**
  - Add sliding-window rate limiting on auth, checkout, coupons, and forms.
  - Add Cloudflare Turnstile bot verification hooks.
  - Implement non-leaking `/api/health` endpoint.
- **Phase 5: Business Logic, Pricing & Payment Security**
  - Enforce authoritative server-side cart recomputation (prices, stock, coupons, totals).
  - Implement server-side Razorpay order creation and HMAC-SHA256 signature verification.
  - Implement atomic database transactions for stock and coupon redemption.
  - Replace fake countdown timer with authentic promotion schedule.
- **Phase 6: Dependencies, Secrets, Supply Chain & CI**
  - Resolve `npm audit` findings.
  - Verify `.gitignore` for all secrets and configure CI workflow templates.
- **Phase 7: Security Bypass & Regression Testing**
  - Write Vitest and Playwright regression suites attempting SQL injection, XSS, IDOR, price tampering, CSRF, and webhook signature forgery.
