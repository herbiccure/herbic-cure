# COMPREHENSIVE SECURITY AUDIT & VULNERABILITY REPORT: HERBIC CURE

**Application:** Herbic Cure (Ayurvedic E-Commerce & Admin CMS)  
**Date:** October 22, 2026  
**Auditor:** Senior Application Security Engineer  
**Scope:** Full-stack audit of Next.js 16 App Router, Prisma ORM, Supabase PostgreSQL & Storage, Upstash Redis, Cashfree PG, Delhivery Logistics, Auth systems, and deployment configurations.  
**Compliance & Methodology:** OWASP Top 10:2025, OWASP ASVS 5.0 (Target Level 2), OWASP API Security Top 10, PCI DSS SAQ-A Scope, India Digital Personal Data Protection Act 2023 (DPDP Act).  
**Status:** **Phase 0–2 Complete — Deliverable for Approval Before Code Remediation (Rules of Engagement)**  

---

## 1. Executive Summary

A comprehensive security audit and vulnerability assessment of the **Herbic Cure** e-commerce platform was conducted. The assessment evaluated customer PII confidentiality, payment transaction integrity (Cashfree), courier fulfillment safety (Delhivery), administrative access controls, serverless caching/rate limiting, and supply-chain dependencies.

The audit identified **6 Critical, 8 High, 6 Medium, and 4 Low** severity findings. Crucially, several vulnerabilities allow unauthenticated administrative takeover, free merchandise checkout bypass, customer PII exposure, and arbitrary phone number authentication:

1. **Unsigned Session Cookie Fallback (Total Authentication Bypass)**: `src/lib/auth/session.ts` includes a legacy JSON parse fallback that accepts raw, unsigned JSON strings as valid admin/customer session tokens, enabling anyone to forge an `OWNER` session.
2. **Master Recovery Key Backdoor**: `src/app/api/admin/change-password/route.ts` allows resetting any administrator password using a hardcoded default `SESSION_SECRET` fallback present in `src/lib/env.ts`.
3. **Client-Side OTP Secret Exposure**: `src/app/api/auth/customer/send-otp/route.ts` sends the TOTP secret key directly inside the client-side `verificationToken` base64 payload, allowing anyone to compute the OTP code without reading SMS messages.
4. **Cashfree Verification Fallback Bypass (Free Merchandise)**: When Cashfree API credentials are unset or experience network timeouts, `src/lib/payment/cashfree.ts` falls back to returning `orderStatus: 'PAID'`, automatically marking orders as paid in the database without any money collected.
5. **Premature Delhivery Shipment Manifestation**: `src/app/api/orders/create/route.ts` registers waybills with Delhivery for unpaid orders before payment is completed, generating manifest fees and risking accidental dispatch.
6. **Inactive Edge Security Middleware**: The edge proxy logic is located in `src/proxy.ts`, which Next.js App Router ignores at runtime because the framework convention requires `middleware.ts`. All edge guards, security headers, and caching directives in `proxy.ts` are inactive.
7. **Supabase PostgREST Public Exposure**: Database tables managed via `prisma db push` lack Row Level Security (RLS) policies in Supabase PostgreSQL, leaving tables readable via PostgREST with the public anon key.

Per the **Rules of Engagement**, **NO CODE HAS BEEN MODIFIED**. This report presents the verified technical findings and proposed remediation plan for owner review and approval.

---

## 2. Vulnerability Severity Matrix

| ID | Title | Severity | CVSS v4 | Status | OWASP Top 10 | ASVS 5.0 ID |
|---|---|---|---|---|---|---|
| **SEC-01** | Unsigned JSON Session Token Fallback Permitting Full Admin Takeover | **CRITICAL** | 9.8 | Confirmed | A01:2025 | 3.2.1, 3.4.1 |
| **SEC-02** | Master Recovery Key Backdoor & Hardcoded Secret Admin Reset | **CRITICAL** | 9.8 | Confirmed | A01:2025 | 2.1.1, 2.5.6 |
| **SEC-03** | Client-Side TOTP Secret Exposure Allowing Universal OTP Bypass | **CRITICAL** | 9.1 | Confirmed | A07:2025 | 2.2.1, 2.8.2 |
| **SEC-04** | Cashfree Gateway Error Fallback Auto-Marking Orders as 'PAID' | **CRITICAL** | 9.4 | Confirmed | A04:2025 | 10.3.1, 10.3.2 |
| **SEC-05** | Cashfree Webhook Missing Replay Protection, Stale Timestamp & Amount Validation | **CRITICAL** | 9.0 | Confirmed | A08:2025 | 10.3.3, 13.2.3 |
| **SEC-06** | Plaintext Upstash Redis Token Committed in `.env.example` | **CRITICAL** | 9.1 | Confirmed | A02:2025 | 14.2.1 |
| **SEC-07** | Premature Delhivery Shipment Manifestation on Unpaid Orders | **HIGH** | 7.5 | Confirmed | A06:2025 | 10.2.1 |
| **SEC-08** | In-Memory Serverless Rate Limiting & Spoofable IP Extraction | **HIGH** | 7.5 | Confirmed | A06:2025 | 11.1.4, 13.1.3 |
| **SEC-09** | Missing Row Level Security (RLS) on Supabase PostgreSQL Public Tables | **HIGH** | 8.2 | Likely | A01:2025 | 4.1.1, 4.1.3 |
| **SEC-10** | Unrestricted Next.js Image Optimization SSRF (`hostname: '**'`) | **HIGH** | 7.7 | Confirmed | A05:2025 | 5.5.4, 12.6.1 |
| **SEC-11** | Stored XSS via Malicious SVG Upload & Flawed Custom Regex Sanitizer | **HIGH** | 7.6 | Confirmed | A05:2025 | 5.1.4, 12.1.1 |
| **SEC-12** | Coupon Concurrency Race Condition & Infinite Over-Redemption | **HIGH** | 7.4 | Likely | A06:2025 | 10.2.2 |
| **SEC-13** | Inventory Stock Decrement Without Race Condition Atomic Guard | **HIGH** | 7.1 | Likely | A06:2025 | 10.2.2 |
| **SEC-14** | 11 Vulnerabilities in npm Dependencies (2 Critical in `tinypool`) | **HIGH** | 7.8 | Confirmed | A03:2025 | 14.2.1 |
| **SEC-15** | Inactive Next.js Edge Middleware (`src/proxy.ts` Ignored at Runtime) | **MEDIUM** | 6.5 | Confirmed | A02:2025 | 14.4.1 |
| **SEC-16** | Customer Login Open Redirect via Unsanitized `callbackUrl` | **MEDIUM** | 6.1 | Confirmed | A01:2025 | 5.1.5 |
| **SEC-17** | CSV / Excel Formula Injection in Admin Analytics Export | **MEDIUM** | 6.8 | Confirmed | A05:2025 | 5.1.5 |
| **SEC-18** | Order / Tracking Enumeration Exposing Customer Order Items & Courier Data | **MEDIUM** | 5.3 | Confirmed | A01:2025 | 4.2.1 |
| **SEC-19** | Missing CSRF Origin Enforcement in Better Auth Configuration | **MEDIUM** | 5.4 | Confirmed | A01:2025 | 4.2.4 |
| **SEC-20** | Inconsistent Customer Identity State Across Better Auth & Customer Tables | **MEDIUM** | 5.3 | Confirmed | A07:2025 | 3.1.1 |
| **SEC-21** | Ineffective Content-Security-Policy with `unsafe-inline`, `unsafe-eval` & `https:` | **LOW** | 4.7 | Confirmed | A02:2025 | 14.4.3 |
| **SEC-22** | Unsanitized Plaintext Tokens in `StaffInvite.tokenHash` Column | **LOW** | 4.3 | Confirmed | A02:2025 | 3.4.1 |
| **SEC-23** | Missing Automated Refund Processing with Cashfree PG | **LOW** | 3.8 | Confirmed | A04:2025 | 10.3.1 |
| **SEC-24** | Unstructured Logging Leaking PII to Stdout | **LOW** | 3.5 | Confirmed | A09:2025 | 7.1.1, 7.1.2 |

---

## 3. Automated Scanning & Tool Execution Summary

Scanners were executed locally against the workspace repository:

| Tool | Version | Target | Result Summary | Raw Report Location |
|---|---|---|---|---|
| **npm audit** | 10.8.2 | `package-lock.json` | 11 vulnerabilities (2 Critical, 6 High, 3 Moderate) flagged in `tinypool`, `braces`, `micromatch`, `fast-glob`, `esbuild`, `vitest`. | `security/reports/npm-audit.json` |
| **Secret Scan (Git)** | git 2.45+ | Commit history & `.env*` | `.env` is gitignored. However, a live Upstash Redis connection string and token were discovered committed in plaintext in `.env.example:61`. | Recorded in findings (SEC-06). |
| **Bundle Scan** | PowerShell AST / Regex | `.next/static/**/*.js` | Verified no runtime secret keys (`CASHFREE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are leaked into client JS bundles. | Verified clean (SEC-02 placeholder identified in admin UI only). |
| **TypeScript Typecheck** | tsc 5.x | Entire codebase | 0 type errors; clean compilation. | Completed. |
| **ESLint SAST** | 9.x flat config | `src/**/*.ts*` | Next.js flat configuration runs cleanly on selective directories; full run was terminated to prevent memory exhaustion on unignored artifacts. | `eslint.config.mjs` review. |

---

## 4. Detailed Technical Findings

### SEC-01 [CRITICAL]: Unsigned JSON Session Token Fallback Permitting Full Admin Takeover
- **Domain:** Authentication / Session Management
- **Files & Lines:** [`src/lib/auth/session.ts:97-106`](file:///d:/Codes/Projects/herbicCure-main/src/lib/auth/session.ts#L97-L106), [`src/lib/auth/adminAuth.ts:27-30`](file:///d:/Codes/Projects/herbicCure-main/src/lib/auth/adminAuth.ts#L27-L30)
- **Status:** **Confirmed (Reproduced in local verification)**
- **Evidence:**
  ```typescript
  // src/lib/auth/session.ts:97-105
  // Graceful fallback for legacy raw JSON during transition
  try {
    const parsed = JSON.parse(token);
    if (parsed && (parsed.id || parsed.email)) {
      return parsed as T;
    }
  } catch {
    // Not valid JSON
  }
  ```
- **Vulnerability:** `verifySessionToken` attempts to verify HMAC-SHA256 signatures, but if the token is not signed with a dot (`.`), it falls back to parsing raw JSON. If the parsed JSON contains an `id` or `email`, it returns the object as a trusted session! In `src/lib/auth/adminAuth.ts:28-29`, `getAdminSession` calls `verifySessionToken<AdminSessionPayload>(token)` and returns the attacker-controlled object.
- **Attack Scenario:** An anonymous attacker sends a request with an unsigned cookie:
  ```http
  Cookie: admin_session={"id":"attacker","email":"attacker@evil.com","role":"OWNER"}
  ```
  `requireAdminAuth()` extracts the cookie, parses it without signature verification, validates `isAdminRole('OWNER') === true`, and grants unrestricted access to all admin APIs (e.g. deleting products, changing site settings, viewing all orders).
- **Remediation:** Remove lines 97–105 from `src/lib/auth/session.ts`. Enforce that all session cookies MUST be signed HMAC-SHA256 tokens (`payload.signature`) using `crypto.timingSafeEqual`. Reject any token lacking a valid cryptographic signature.
- **Standards Mapping:** OWASP Top 10:2025 A01 Broken Access Control; OWASP ASVS 5.0: 3.2.1, 3.4.1.

---

### SEC-02 [CRITICAL]: Master Recovery Key Backdoor & Hardcoded Secret Admin Reset
- **Domain:** Authentication / Secrets Management
- **Files & Lines:** [`src/app/api/admin/change-password/route.ts:82-92`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/admin/change-password/route.ts#L82-L92), [`src/lib/env.ts:8`](file:///d:/Codes/Projects/herbicCure-main/src/lib/env.ts#L8)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/api/admin/change-password/route.ts:82-92
  const validRecoveryKeys = [
    process.env.SESSION_SECRET,
    process.env.BETTER_AUTH_SECRET,
  ].filter(Boolean);

  if (recoveryKey && validRecoveryKeys.length > 0) {
    const cleanKey = recoveryKey.trim();
    if (validRecoveryKeys.some((k) => k === cleanKey || k?.slice(0, 16) === cleanKey)) {
      isAuthorized = true;
    }
  }
  ```
  Combined with `src/lib/env.ts:8`:
  ```typescript
  SESSION_SECRET: z.string().default('b27349ffc160769a36a3cc60c2af9467e16ab70484a2bacfb8845e3e5694c70b')
  ```
- **Vulnerability:** The password change route authorizes a password change without the current password if `recoveryKey` matches `SESSION_SECRET` or the first 16 characters of `SESSION_SECRET` (`k?.slice(0, 16)`). Because `SESSION_SECRET` defaults to a public hardcoded string in the source repository, an attacker knows the first 16 characters (`b27349ffc160769a`).
- **Attack Scenario:** An unauthenticated attacker submits a POST request to `/api/admin/change-password`:
  ```json
  {
    "email": "owner@herbiccure.com",
    "recoveryKey": "b27349ffc160769a",
    "newPassword": "HackedPassword2026!",
    "confirmPassword": "HackedPassword2026!"
  }
  ```
  The endpoint accepts the recovery key, hashes the new password with Argon2, updates the database, and locks out the real owner.
- **Remediation:**
  1. Completely remove the `recoveryKey` backdoor from `src/app/api/admin/change-password/route.ts` and the master key input from `src/app/(admin)/admin/login/page.tsx`.
  2. Remove hardcoded fallback secrets from `src/lib/env.ts`. Make `SESSION_SECRET` and `BETTER_AUTH_SECRET` strictly required environment variables that cause the application to fail to boot if missing.
  3. Require current password verification or signed time-limited reset tokens sent via email.
- **Standards Mapping:** OWASP Top 10:2025 A01 Broken Access Control; OWASP ASVS 5.0: 2.1.1, 2.5.6.

---

### SEC-03 [CRITICAL]: Client-Side TOTP Secret Exposure Allowing Universal OTP Bypass
- **Domain:** Authentication / Multi-Factor Authentication
- **Files & Lines:** [`src/lib/otp.ts:71-95`](file:///d:/Codes/Projects/herbicCure-main/src/lib/otp.ts#L71-L95), [`src/app/api/auth/customer/send-otp/route.ts:82-94`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/auth/customer/send-otp/route.ts#L82-L94), [`src/lib/sms.ts:87-101`](file:///d:/Codes/Projects/herbicCure-main/src/lib/sms.ts#L87-L101)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/lib/otp.ts:73-89
  const sessionSecret = authenticator.generateSecret();
  const otp = authenticator.generate(sessionSecret);
  const payload = JSON.stringify({
    phone: normalizedPhone,
    sessionSecret, // <-- CRITICAL: Secret key sent to client
    expiresAt,
    salt: crypto.randomBytes(8).toString('hex'),
  });
  const verificationToken = Buffer.from(`${payload}::${signature}`).toString('base64');
  ```
  And in `src/app/api/auth/customer/send-otp/route.ts:91-93`:
  ```typescript
  return NextResponse.json({
    success: true,
    verificationToken: otpResult.verificationToken,
    devOtp: smsResult.devOtp, // Returned when SMS gateway keys are unset
  });
  ```
- **Vulnerability:** The server generates a TOTP secret key (`sessionSecret`) and places it directly inside the `verificationToken` returned in the HTTP response body to the browser. Any client can base64-decode the token, extract `sessionSecret`, and generate the exact 6-digit OTP code using standard TOTP algorithms without receiving any SMS. Furthermore, if SMS credentials are unset, `devOtp: otp` is directly included in the JSON response!
- **Attack Scenario:** An attacker requests an OTP for any customer's phone number (`+91 9876543210`). The API returns `{ verificationToken: "..." }`. The attacker base64-decodes the payload, reads `sessionSecret`, generates the valid 6-digit code, and registers or logs into the victim's account.
- **Remediation:**
  1. Never transmit OTP secret keys to the client. Store OTP hashes (`crypto.createHash('sha256').update(phone + otp + salt)`) server-side in Redis or Prisma `VerificationToken` table with a 5-minute TTL.
  2. The client receives only an opaque random challenge ID.
  3. Completely strip `devOtp` from production API responses (`if (process.env.NODE_ENV === 'production')`).
- **Standards Mapping:** OWASP Top 10:2025 A07 Identification and Authentication Failures; OWASP ASVS 5.0: 2.2.1, 2.8.2.

---

### SEC-04 [CRITICAL]: Cashfree Gateway Error Fallback Auto-Marking Orders as 'PAID'
- **Domain:** Payments & Financial Integrity
- **Files & Lines:** [`src/lib/payment/cashfree.ts:173-180`](file:///d:/Codes/Projects/herbicCure-main/src/lib/payment/cashfree.ts#L173-L180), [`src/app/api/payment/cashfree/verify/route.ts:17-30`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/payment/cashfree/verify/route.ts#L17-L30)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/lib/payment/cashfree.ts:173-180
  // Fallback for simulated or active orders
  return {
    orderId,
    orderStatus: 'PAID', // <-- CRITICAL: Defaults to PAID on error
    orderAmount: 0,
    orderCurrency: 'INR',
  };
  ```
  And in `src/app/api/payment/cashfree/verify/route.ts:17-29`:
  ```typescript
  const cashfreeStatus = await getCashfreeOrderStatus(orderId);
  const isPaid = cashfreeStatus.orderStatus === 'PAID';

  if (isPaid) {
    await prisma.order.updateMany({
      where: { orderNumber: orderId },
      data: {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        paymentMethod: 'CASHFREE',
      },
    });
  }
  ```
- **Vulnerability:** When Cashfree credentials are not loaded, or if the server encounters a network timeout while contacting `api.cashfree.com/pg/orders/${orderId}`, `getCashfreeOrderStatus()` catches the exception and returns `orderStatus: 'PAID'`. The verification endpoint (`/api/payment/cashfree/verify?order_id=...`) receives this fallback and updates the database order to `paymentStatus: 'PAID', orderStatus: 'CONFIRMED'`.
- **Attack Scenario:** An attacker places an online order for ₹5,000, cancels or closes the payment modal, and navigates directly to `/api/payment/cashfree/verify?order_id=HC-123456`. If the gateway call experiences a glitch or if credentials are misconfigured, the order is confirmed as `PAID` without payment.
- **Remediation:** Payment verification must **fail closed**. Never return `PAID` in error handlers or fallbacks. In development or test environments, explicitly return `FAILED` unless running a dedicated, authenticated sandbox mock.
- **Standards Mapping:** OWASP Top 10:2025 A04 Insecure Design; OWASP ASVS 5.0: 10.3.1, 10.3.2.

---

### SEC-05 [CRITICAL]: Cashfree Webhook Missing Replay Protection, Stale Timestamp & Amount Validation
- **Domain:** Payments & Financial Integrity
- **Files & Lines:** [`src/app/api/payment/cashfree/webhook/route.ts:7-59`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/payment/cashfree/webhook/route.ts#L7-L59), [`src/lib/payment/cashfree.ts:186-211`](file:///d:/Codes/Projects/herbicCure-main/src/lib/payment/cashfree.ts#L186-L211)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/api/payment/cashfree/webhook/route.ts:24-37
  const orderNumber = orderData?.order_id;
  if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || paymentData?.payment_status === 'SUCCESS') {
    await prisma.order.updateMany({
      where: { orderNumber },
      data: {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        paymentMethod: 'CASHFREE',
      },
    });
  }
  ```
- **Vulnerability:**
  1. **No Timestamp Freshness Check**: The `x-webhook-timestamp` header is not checked against current time (e.g. `Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000`). Stale webhooks can be replayed indefinitely.
  2. **No Amount / Currency Verification**: The handler never verifies that `orderData.order_amount` or `paymentData.payment_amount` equals `order.total` and currency is `INR`. An attacker who pays ₹1 on a tampered gateway session could trigger this webhook to mark a ₹5,000 order as paid.
  3. **No Idempotency / Double-Spend Guard**: `cf_payment_id` is neither saved nor checked for duplicate processing.
  4. **Timing-Safe Equal Bug**: `src/lib/payment/cashfree.ts:203-206` calls `crypto.timingSafeEqual` without first verifying equal buffer lengths, causing unhandled exceptions if signature lengths differ. If `CASHFREE_SECRET_KEY` is empty, `verifyCashfreeWebhook` returns `true`!
- **Remediation:**
  1. Verify HMAC-SHA256 signature against the raw body and reject timestamps older than 5 minutes.
  2. Fetch the corresponding order from Prisma; verify that `paymentAmount === order.total` and `currency === 'INR'`.
  3. Store `cf_payment_id` in a unique column on `Order` to ensure idempotency.
  4. Fail closed if `CASHFREE_SECRET_KEY` is not configured.
- **Standards Mapping:** OWASP Top 10:2025 A08 Software and Data Integrity Failures; OWASP ASVS 5.0: 10.3.3, 13.2.3.

---

### SEC-06 [CRITICAL]: Plaintext Upstash Redis Token Committed in `.env.example`
- **Domain:** Secrets Management / Configuration
- **Files & Lines:** [`d:/Codes/Projects/herbicCure-main/.env.example:60-61`](file:///d:/Codes/Projects/herbicCure-main/.env.example#L60-L61)
- **Status:** **Confirmed (File evidence)**
- **Evidence:**
  `UPSTASH_REDIS_REST_URL="https://modern-alpaca-136132.upstash.io"`  
  `UPSTASH_REDIS_REST_TOKEN="redis-cli --tls -u redis://default:gQAAAAAAAhPEAAIgcDEzOWU3ZGEzNjBiYTc0ZjA5OTViNjc5Y2FmYzE3NjE5Zg@modern-alpaca-136132.upstash.io:6379"`
- **Vulnerability:** A live production/staging Upstash Redis database REST URL and connection credential containing authentication token was committed to the repository in `.env.example`.
- **Attack Scenario:** Anyone with read access to the git repository can connect to the Upstash Redis instance, read all cached session data, flush rate limits, or poison cached data.
- **Remediation:**
  1. **Immediate Owner Action**: Rotate the Upstash Redis database token in the Upstash console immediately.
  2. Replace line 61 in `.env.example` with a dummy placeholder string (`UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token_here"`).
- **Standards Mapping:** OWASP Top 10:2025 A02 Cryptographic Failures; OWASP ASVS 5.0: 14.2.1.

---

### SEC-07 [HIGH]: Premature Delhivery Shipment Manifestation on Unpaid Orders
- **Domain:** Logistics / Business Logic
- **Files & Lines:** [`src/app/api/orders/create/route.ts:182-212`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/create/route.ts#L182-L212)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/api/orders/create/route.ts:182-203
  // 6.1 Dispatch / Manifest shipment via Delhivery Logistics
  const delhiveryRes = await createDelhiveryShipment({
    orderNumber,
    customerName: name,
    customerPhone: phone,
    customerEmail: authoritativeEmail,
    customerAddress: address,
    city,
    state,
    pincode,
    totalAmount: calculatedFinalTotal,
    paymentMethod: paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    items: verifiedOrderItems,
  });
  ```
- **Vulnerability:** When a customer creates an order selecting online payment (`CASHFREE`), the order endpoint immediately calls `createDelhiveryShipment()` before the user has even been redirected to Cashfree! A live Delhivery waybill (AWB) is created and registered with Delhivery logistics. If the customer closes the tab or fails payment, the shipment manifest remains active in Delhivery's system.
- **Attack Scenario:** An attacker scripts 1,000 checkout submissions selecting online payment, never completing payment. Delhivery registers 1,000 active prepaid shipments scheduled for pickup from the Herbic Cure warehouse, leading to logistics chaos and financial billing from Delhivery.
- **Remediation:** Manifest Delhivery shipments **only** after payment confirmation (for prepaid orders, via Cashfree webhook) or after phone/OTP verification (for COD orders).
- **Standards Mapping:** OWASP Top 10:2025 A06 Insecure Design; OWASP ASVS 5.0: 10.2.1.

---

### SEC-08 [HIGH]: In-Memory Serverless Rate Limiting & Spoofable IP Extraction
- **Domain:** Denial of Service / Abuse Prevention
- **Files & Lines:** [`src/lib/rateLimit.ts:8-19, 65-75`](file:///d:/Codes/Projects/herbicCure-main/src/lib/rateLimit.ts#L8-L19), [`src/lib/cache/redis.ts:53-60`](file:///d:/Codes/Projects/herbicCure-main/src/lib/cache/redis.ts#L53-L60)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/lib/rateLimit.ts:9
  const rateLimitMap = new Map<string, RateLimitRecord>();

  // src/lib/rateLimit.ts:65-69
  export function getClientIp(req: NextRequest | Request): string {
    const forwarded = (req.headers as any).get?.('x-forwarded-for') || (req.headers as any)['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
  ```
- **Vulnerability:**
  1. **Serverless Invalidation**: In Vercel serverless functions, `new Map()` exists only in memory for a single lambda container. Concurrent requests hitting different lambdas do not share state, rendering rate limiting ineffective.
  2. **IP Spoofing**: `forwarded.split(',')[0]` blindly trusts the first client-supplied `X-Forwarded-For` header. An attacker can pass `X-Forwarded-For: 1.2.3.4` or randomize this header on every request to bypass rate limits entirely.
  3. **Silent Redis Fallback**: `src/lib/cache/redis.ts` falls back to `MemoryCacheClient` when Upstash credentials are not loaded, failing silently in production.
- **Remediation:**
  1. Implement `@upstash/ratelimit` with sliding windows backed by Upstash Redis.
  2. Extract client IP using Vercel edge header (`req.headers.get('x-vercel-forwarded-for')` or `req.ip`), never trusting raw user-supplied `x-forwarded-for` directly.
  3. In production (`process.env.NODE_ENV === 'production'`), throw a fatal error on boot if Upstash Redis credentials are unset.
- **Standards Mapping:** OWASP Top 10:2025 A06 Identification and Authentication Failures / Rate Limiting; OWASP ASVS 5.0: 11.1.4, 13.1.3.

---

### SEC-09 [HIGH]: Missing Row Level Security (RLS) on Supabase PostgreSQL Public Tables
- **Domain:** Database & Data Tier Security
- **Files & Lines:** `prisma/schema.prisma`, Supabase Security Advisor Reports
- **Status:** **Likely (Architecture evidence)**
- **Vulnerability:** Tables created via Prisma migrations or `prisma db push` in Supabase reside in the `public` schema. By default in Supabase, PostgREST exposes all tables in the `public` schema via `https://[PROJECT].supabase.co/rest/v1/[TableName]`. Because RLS is disabled by default on Prisma-managed tables, any anonymous client possessing the public `NEXT_PUBLIC_SUPABASE_ANON_KEY` can directly query sensitive tables (`User`, `Account`, `Order`, `StaffInvite`, `VerificationToken`, `TwoFactor`).
- **Attack Scenario:** An attacker takes the public anon key from the storefront client bundle and sends:
  ```bash
  curl -H "apikey: <ANON_KEY>" https://[PROJECT].supabase.co/rest/v1/User?select=*
  ```
  The endpoint returns all users, emails, phone numbers, and administrative roles.
- **Remediation:**
  1. Execute SQL in Supabase to enable Row Level Security on all public tables:
     `ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;` (repeated for all Prisma tables).
  2. Revoke all permissions on public tables from the `anon` and `authenticated` roles (`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;`).
  3. Restrict Prisma to connect through direct PostgreSQL connection pooling where the application role operates as the dedicated owner.
- **Standards Mapping:** OWASP Top 10:2025 A01 Broken Access Control; OWASP ASVS 5.0: 4.1.1, 4.1.3.

---

### SEC-10 [HIGH]: Unrestricted Next.js Image Optimization SSRF (`hostname: '**'`)
- **Domain:** Server-Side Request Forgery (SSRF) / Input Validation
- **Files & Lines:** [`next.config.ts:89-98`](file:///d:/Codes/Projects/herbicCure-main/next.config.ts#L89-L98)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // next.config.ts:89-98
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',
    },
    {
      protocol: 'http',
      hostname: '**',
    },
  ],
  ```
- **Vulnerability:** Next.js built-in image optimization endpoint (`/_next/image?url=...&w=...&q=...`) fetches remote images server-side. Setting `hostname: '**'` with both `http` and `https` allows attackers to force the Next.js server to issue HTTP GET requests to arbitrary internal and external addresses, including internal cloud metadata endpoints (`http://169.254.169.254/latest/meta-data`) and local loopback services (`http://localhost:5432`).
- **Remediation:** Replace wildcards with an explicit, restrictive allowlist of trusted image domains:
  - `images.unsplash.com`
  - `res.cloudinary.com`
  - `[PROJECT].supabase.co`
  - Disallow the unencrypted `http` protocol entirely.
- **Standards Mapping:** OWASP Top 10:2025 A05 Security Misconfiguration; OWASP ASVS 5.0: 5.5.4, 12.6.1.

---

### SEC-11 [HIGH]: Stored XSS via Malicious SVG Upload & Flawed Custom Regex Sanitizer
- **Domain:** Cross-Site Scripting (XSS) / File Upload
- **Files & Lines:** [`src/app/api/admin/upload/route.ts:191-193`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/admin/upload/route.ts#L191-L193), [`src/app/uploads/[filename]/route.ts:58-62, 115-117`](file:///d:/Codes/Projects/herbicCure-main/src/app/uploads/%5Bfilename%5D/route.ts#L58-L62), [`src/lib/sanitizeHtml.ts:1-20`](file:///d:/Codes/Projects/herbicCure-main/src/lib/sanitizeHtml.ts#L1-L20)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/api/admin/upload/route.ts:191-193
  } else {
    ext = '.svg';
    finalMimeType = 'image/svg+xml';
  }
  ```
  And `src/app/uploads/[filename]/route.ts`:
  ```typescript
  'Content-Type': contentType, // 'image/svg+xml' served without Content-Disposition: attachment
  ```
- **Vulnerability:**
  1. When an SVG is uploaded, it completely bypasses Sharp image sanitization. It is stored and served with `Content-Type: image/svg+xml` without `Content-Disposition: attachment` and without a restricting Content-Security-Policy.
  2. If an SVG contains `<svg onload="alert(document.cookie)">`, navigating to `/uploads/image.svg` executes arbitrary JavaScript in the application origin.
  3. `src/lib/sanitizeHtml.ts` relies on custom regex replace calls (`replace(/\s+on[a-z]+.../)`), which fails to block XSS payloads using slashes (`<svg/onload=alert(1)>`) or animation events (`<animate onbegin=...>`).
- **Remediation:**
  1. Serve all user-uploaded SVG files with `Content-Disposition: attachment; filename="..."` and `Content-Security-Policy: default-src 'none'`.
  2. Replace `sanitizeHtml.ts` with an established, audited sanitizer library (`isomorphic-dompurify`).
- **Standards Mapping:** OWASP Top 10:2025 A05 Security Misconfiguration / Injection; OWASP ASVS 5.0: 5.1.4, 12.1.1.

---

### SEC-12 [HIGH]: Coupon Concurrency Race Condition & Infinite Over-Redemption
- **Domain:** Business Logic Abuse
- **Files & Lines:** [`src/app/api/orders/create/route.ts:261-270`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/create/route.ts#L261-L270)
- **Status:** **Likely (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/api/orders/create/route.ts:261-269
  if (validatedCouponId) {
    await tx.coupon.update({
      where: { id: validatedCouponId },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }
  ```
- **Vulnerability:** `tx.coupon.update` performs an unconditional increment on `usedCount`. The check `coupon.usedCount < coupon.usageLimit` occurs outside the transaction prior to execution. If two concurrent requests use a coupon with 1 remaining use, both pass the preliminary check, and both successfully increment `usedCount` to 2.
- **Remediation:** Enforce atomic conditional updates inside the transaction:
  ```typescript
  const updated = await tx.coupon.updateMany({
    where: {
      id: validatedCouponId,
      active: true,
      OR: [
        { usageLimit: null },
        { usedCount: { lt: prisma.coupon.fields.usageLimit } }
      ]
    },
    data: { usedCount: { increment: 1 } },
  });
  if (updated.count === 0) throw new Error('Coupon usage limit reached');
  ```
- **Standards Mapping:** OWASP Top 10:2025 A06 Insecure Design; OWASP ASVS 5.0: 10.2.2.

---

### SEC-13 [HIGH]: Inventory Stock Decrement Without Race Condition Atomic Guard
- **Domain:** Business Logic Abuse
- **Files & Lines:** [`src/app/api/orders/create/route.ts:248-258`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/create/route.ts#L248-L258)
- **Status:** **Likely (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/api/orders/create/route.ts:250-256
  await tx.product.update({
    where: { id: item.id },
    data: {
      stockQuantity: {
        decrement: item.quantity,
      },
    },
  });
  ```
- **Vulnerability:** The check `dbProduct.stockQuantity < item.quantity` occurs before entering the transaction. If two buyers concurrently attempt to purchase the last unit, both pass the check, both decrement stock, and `stockQuantity` drops to `-1`, resulting in overselling and fulfillment failure.
- **Remediation:** Enforce conditional stock decrement inside the transaction:
  ```typescript
  const updated = await tx.product.updateMany({
    where: {
      id: item.id,
      stockQuantity: { gte: item.quantity },
    },
    data: { stockQuantity: { decrement: item.quantity } },
  });
  if (updated.count === 0) throw new Error(`Stock depleted for ${item.id}`);
  ```
- **Standards Mapping:** OWASP Top 10:2025 A06 Insecure Design; OWASP ASVS 5.0: 10.2.2.

---

### SEC-14 [HIGH]: 11 Vulnerabilities in npm Dependencies (2 Critical in `tinypool`)
- **Domain:** Software Supply Chain
- **Files & Lines:** `package.json`, `package-lock.json`
- **Status:** **Confirmed (`npm audit` output)**
- **Evidence:**
  `npm audit` detected:
  - **Critical**: `tinypool <=2.1.1` (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr - Prototype Pollution to RCE in worker options)
  - **High**: `braces` / `micromatch` / `fast-glob` / `@next/eslint-plugin-next` (GHSA-vfj7-8cjw-p6xm - ReDoS / Stack Exhaustion)
  - **Moderate**: `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99), `@vitest/mocker <=4.1.11` (GHSA-82fw-gwwq-j7x9)
- **Remediation:** Run targeted dependency updates (`npm update vitest @vitest/mocker tinypool`, update eslint dependencies), verify compatibility, and pin minimum patched versions.
- **Standards Mapping:** OWASP Top 10:2025 A03 Software Supply Chain Failures; OWASP ASVS 5.0: 14.2.1.

---

### SEC-15 [MEDIUM]: Inactive Next.js Edge Middleware (`src/proxy.ts` Ignored at Runtime)
- **Domain:** Configuration / Edge Security
- **Files & Lines:** [`src/proxy.ts:1-84`](file:///d:/Codes/Projects/herbicCure-main/src/proxy.ts#L1-L84)
- **Status:** **Confirmed (Next.js architecture)**
- **Vulnerability:** Next.js App Router exclusively recognizes `middleware.ts` (or `src/middleware.ts`). The project renamed this file to `src/proxy.ts`. Next.js does not invoke `src/proxy.ts` during HTTP request routing. As a result, trailing slash normalization, edge security headers (`X-Content-Type-Options`, `X-Frame-Options`), zero-cache headers for private routes, and edge-level admin route guards are completely non-functional in production.
- **Remediation:** Create `src/middleware.ts` that exports the middleware function and config matcher, properly invoking the proxy logic.
- **Standards Mapping:** OWASP Top 10:2025 A02 Cryptographic Failures / Security Misconfiguration; OWASP ASVS 5.0: 14.4.1.

---

### SEC-16 [MEDIUM]: Customer Login Open Redirect via Unsanitized `callbackUrl`
- **Domain:** Input Validation / Open Redirect
- **Files & Lines:** [`src/app/account/login/page.tsx:13, 59`](file:///d:/Codes/Projects/herbicCure-main/src/app/account/login/page.tsx#L13)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/account/login/page.tsx:13, 59
  const callbackUrl = searchParams.get('callbackUrl') || '/account';
  ...
  window.location.href = targetRedirect;
  ```
- **Vulnerability:** The login page reads `callbackUrl` from the URL parameters and performs `window.location.href = targetRedirect;` upon successful authentication. The only check performed is `if (!isAdmin && targetRedirect.startsWith('/admin')) targetRedirect = '/account';`. It does not verify that `callbackUrl` is a relative internal path.
- **Attack Scenario:** Phishing link: `https://www.herbiccure.com/account/login?callbackUrl=https://attacker-fake-herbic.com/claim-coupon`. After logging in, the victim is redirected to the attacker's phishing site.
- **Remediation:** Enforce internal relative path validation on `callbackUrl`:
  `const isSafe = callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') && !callbackUrl.includes('\\') && !callbackUrl.includes(':');`
- **Standards Mapping:** OWASP Top 10:2025 A01 Broken Access Control; OWASP ASVS 5.0: 5.1.5.

---

### SEC-17 [MEDIUM]: CSV / Excel Formula Injection in Admin Analytics Export
- **Domain:** Input Validation / Injection
- **Files & Lines:** [`src/app/(admin)/admin/analytics/page.tsx:309-313`](file:///d:/Codes/Projects/herbicCure-main/src/app/%28admin%29/admin/analytics/page.tsx#L309-L313)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/(admin)/admin/analytics/page.tsx:309
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
  ```
- **Vulnerability:** Customer names or product titles containing spreadsheet formula prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`) are concatenated directly into CSV rows without quoting or sanitization.
- **Attack Scenario:** A customer places an order with the name `=cmd|'/C calc'!A0`. When an administrator exports the analytics report to CSV and opens it in Microsoft Excel, Excel executes the command.
- **Remediation:** Escape every CSV cell. If a string starts with `=`, `+`, `-`, `@`, prepend a single quote (`'`) to force the spreadsheet to treat it as plain text.
- **Standards Mapping:** OWASP Top 10:2025 A05 Injection; OWASP ASVS 5.0: 5.1.5.

---

### SEC-18 [MEDIUM]: Order / Tracking Enumeration Exposing Customer Order Items & Courier Data
- **Domain:** Broken Object Level Authorization (IDOR)
- **Files & Lines:** [`src/app/api/orders/track/route.ts:34-50`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/track/route.ts#L34-L50)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/app/api/orders/track/route.ts:37-43
  order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: { equals: qClean } },
        { customerPhone: { equals: qClean.replace(/\D/g, '').slice(-10) } },
      ],
    },
  ```
- **Vulnerability:** The tracking API allows unauthenticated querying by `orderNumber` alone or `customerPhone` alone. Order numbers follow a simple timestamp format (`HC-${Date.now().toString().slice(-6)}`). An automated script can iterate through numbers and retrieve order details, full lists of purchased items, prices, shipping courier name, and live Delhivery tracking numbers.
- **Remediation:** Require **both** order number AND matching last 4 digits of phone number (or customer email confirmation), or require a signed expiring tracking token (`?token=...`).
- **Standards Mapping:** OWASP Top 10:2025 A01 Broken Access Control; OWASP ASVS 5.0: 4.2.1.

---

### SEC-19 [MEDIUM]: Missing CSRF Origin Enforcement in Better Auth Configuration
- **Domain:** Authentication / CSRF
- **Files & Lines:** [`src/lib/auth/auth.ts:108-117, 124`](file:///d:/Codes/Projects/herbicCure-main/src/lib/auth/auth.ts#L108-L117)
- **Status:** **Confirmed (Code evidence)**
- **Evidence:**
  ```typescript
  // src/lib/auth/auth.ts:108-110, 124
  if (origin) {
    allowed.push(origin); // <-- Allows ANY Origin header
  }
  advanced: {
    disableOriginCheck: true, // <-- Disables Origin checking
  }
  ```
- **Vulnerability:** `trustedOrigins` automatically pushes any incoming `origin` or `referer` header to the trusted list, and `disableOriginCheck` is explicitly set to `true`. This removes cross-origin request protection in Better Auth, opening the authentication endpoints to cross-site request forgery.
- **Remediation:** Remove `disableOriginCheck: true` and restrict `trustedOrigins` to `process.env.NEXT_PUBLIC_APP_URL` and authorized staging/production domains.
- **Standards Mapping:** OWASP Top 10:2025 A01 Broken Access Control; OWASP ASVS 5.0: 4.2.4.

---

### SEC-20 [MEDIUM]: Inconsistent Customer Identity State Across Better Auth & Customer Tables
- **Domain:** Architecture / Data Integrity
- **Files & Lines:** `src/context/AuthContext.tsx`, `src/app/api/auth/customer/login/route.ts`, `prisma/schema.prisma`
- **Status:** **Confirmed (Code evidence)**
- **Vulnerability:** Customer authentication is split across two disjoint models: `User` (managed by Better-Auth with Argon2 hashes) and `Customer` (legacy table with bcryptjs hashes). `AuthContext.tsx` uses Better Auth client, while `api/auth/customer/login` queries the `Customer` table and sets `customer_session`. This creates session synchronization failures, password desynchronization, and account lockouts.
- **Remediation:** Unify all customer accounts into the single `User` table under Better Auth, deprecating the legacy `Customer` credentials store.
- **Standards Mapping:** OWASP Top 10:2025 A07 Identification and Authentication Failures; OWASP ASVS 5.0: 3.1.1.

---

### SEC-21 [LOW]: Ineffective Content-Security-Policy with `unsafe-inline`, `unsafe-eval` & `https:`
- **Domain:** Security Headers
- **Files & Lines:** [`next.config.ts:29-44`](file:///d:/Codes/Projects/herbicCure-main/next.config.ts#L29-L44)
- **Status:** **Confirmed (Code evidence)**
- **Vulnerability:** CSP defines `script-src 'self' 'unsafe-eval' 'unsafe-inline' https:`. The inclusion of `https:` and `'unsafe-inline'` permits any script from any HTTPS origin and any inline script, nullifying CSP protection against XSS attacks.
- **Remediation:** Adopt a nonce-based CSP via middleware for dynamic pages, restrict script sources to `'self'` and explicitly enumerated third parties (e.g. `https://sdk.cashfree.com`), and remove `unsafe-eval` from production builds.
- **Standards Mapping:** OWASP Top 10:2025 A02 Security Misconfiguration; OWASP ASVS 5.0: 14.4.3.

---

### SEC-22 [LOW]: Unsanitized Plaintext Tokens in `StaffInvite.tokenHash` Column
- **Domain:** Cryptographic Storage
- **Files & Lines:** [`src/data/admin/staff.ts:50-60`](file:///d:/Codes/Projects/herbicCure-main/src/data/admin/staff.ts#L50-L60)
- **Status:** **Confirmed (Code evidence)**
- **Vulnerability:** The column `tokenHash` stores the raw plaintext 32-byte hex string (`token`) instead of its SHA-256 hash. If database records are read by an unauthorized actor, all pending staff invite tokens can be used immediately.
- **Remediation:** Hash the token with `crypto.createHash('sha256').update(token).digest('hex')` before writing to `tokenHash`.
- **Standards Mapping:** OWASP Top 10:2025 A02 Cryptographic Failures; OWASP ASVS 5.0: 3.4.1.

---

### SEC-23 [LOW]: Missing Automated Refund Processing with Cashfree PG
- **Domain:** Payments & Financial Integrity
- **Files & Lines:** [`src/data/admin/refunds.ts:101-138`](file:///d:/Codes/Projects/herbicCure-main/src/data/admin/refunds.ts#L101-L138)
- **Status:** **Confirmed (Code evidence)**
- **Vulnerability:** Approving a refund in the admin portal updates the database order status to `REFUNDED`, but never contacts Cashfree's refund API (`/pg/orders/{order_id}/refunds`). The customer does not receive their funds automatically, creating manual reconciliation overhead.
- **Remediation:** Integrate Cashfree PG refund API call within `approveRefundRequest()` and store the returned `cf_refund_id`.
- **Standards Mapping:** OWASP Top 10:2025 A04 Insecure Design; OWASP ASVS 5.0: 10.3.1.

---

### SEC-24 [LOW]: Unstructured Logging Leaking PII to Stdout
- **Domain:** Logging and Monitoring
- **Files & Lines:** [`src/lib/sms.ts:88-93`](file:///d:/Codes/Projects/herbicCure-main/src/lib/sms.ts#L88-L93), [`src/app/api/orders/create/route.ts`](file:///d:/Codes/Projects/herbicCure-main/src/app/api/orders/create/route.ts)
- **Status:** **Confirmed (Code evidence)**
- **Vulnerability:** Customer phone numbers, OTP codes, and order details are logged directly using `console.log` in plain text.
- **Remediation:** Introduce a structured logging library (`pino`) with automatic redaction rules for passwords, OTPs, phone numbers, and tokens.
- **Standards Mapping:** OWASP Top 10:2025 A09 Security Logging and Monitoring Failures; OWASP ASVS 5.0: 7.1.1, 7.1.2.

---

## 5. Manual Actions for Owner

These actions require manual steps in external dashboards or configuration panels:

| Item | Service / Dashboard | Action Required |
|---|---|---|
| **1. Rotate Upstash Token** | [Upstash Console](https://console.upstash.com) | The Redis token committed in `.env.example:61` must be rotated immediately. Update Vercel environment variables with the new token. |
| **2. Enable RLS in Supabase** | [Supabase SQL Editor](https://app.supabase.com) | Run the RLS hardening script: enable Row Level Security on all public tables and revoke `anon` / `authenticated` privileges from sensitive tables. |
| **3. Upgrade Vercel Plan** | [Vercel Dashboard](https://vercel.com) | The Hobby plan prohibits commercial e-commerce use. Upgrade to Vercel Pro before production public launch to enable Vercel WAF and edge rate limiting. |
| **4. Cashfree Production Keys** | [Cashfree Merchant Dashboard](https://merchant.cashfree.com) | Verify webhook endpoint URL is set to `https://www.herbiccure.com/api/payment/cashfree/webhook`. Ensure live API keys are populated in Vercel production environment variables. |
| **5. Delhivery Production Setup** | [Delhivery One Dashboard](https://one.delhivery.com) | Confirm warehouse pickup location name in `.env` matches the registered facility name exactly. Request tracking webhook integration from Delhivery support. |
| **6. Enforce Account 2FA** | All Provider Dashboards | Ensure Two-Factor Authentication (2FA) is strictly enforced for all owner/admin accounts on GitHub, Vercel, Supabase, Upstash, Cashfree, Delhivery, and GoDaddy. |

---

## 6. Fix Plan & Effort Estimates (Phase 3)

Remediation will be executed in sequential, test-backed commits upon user approval:

### Group 1: Critical Authentication & Session Hardening (Effort: ~3 hours)
- Fix SEC-01: Remove unsigned JSON fallback in `src/lib/auth/session.ts`; enforce strict HMAC verification.
- Fix SEC-02: Eliminate `recoveryKey` backdoor in `change-password/route.ts` and remove hardcoded secrets in `env.ts`.
- Fix SEC-03: Refactor OTP service (`otp.ts`): store hashed OTPs server-side with 5-minute TTL; eliminate client-side secret exposure; strip `devOtp` in production.
- Fix SEC-19: Enforce strict origin checking in Better Auth (`auth.ts`).

### Group 2: Payment Gateway & Financial Integrity (Effort: ~3.5 hours)
- Fix SEC-04: Remove default `'PAID'` fallback from `cashfree.ts`; ensure gateway verification fails closed.
- Fix SEC-05: Implement robust webhook verification in `cashfree/webhook/route.ts`: verify timestamp freshness (< 5 mins), validate exact amount and currency against database order, enforce idempotency with `cf_payment_id`.
- Fix SEC-23: Wire automated gateway refund calls into `refunds.ts`.

### Group 3: Logistics & Abuse Prevention (Effort: ~3 hours)
- Fix SEC-07: Defer Delhivery shipment creation until payment is confirmed or COD is verified.
- Fix SEC-08: Replace in-memory rate limiting with `@upstash/ratelimit` over Upstash Redis; use trusted Vercel edge IP extraction.
- Fix SEC-12: Implement atomic conditional updates for coupon redemption (`updateMany` with `usedCount < usageLimit`).
- Fix SEC-13: Implement atomic conditional inventory decrements (`stockQuantity >= requestedQuantity`).

### Group 4: Edge, Platform & Input Hardening (Effort: ~3 hours)
- Fix SEC-15: Implement standard `src/middleware.ts` to activate edge security headers and admin guards.
- Fix SEC-10: Restrict `next.config.ts` image `remotePatterns` to trusted CDNs; disable `http:`.
- Fix SEC-11: Replace regex sanitizer with `isomorphic-dompurify`; serve SVGs with `Content-Disposition: attachment`.
- Fix SEC-16: Enforce internal path validation on customer login `callbackUrl`.
- Fix SEC-17: Sanitize CSV exports against spreadsheet formula injection.
- Fix SEC-18: Require dual verification (order number + phone suffix) on tracking lookups.

### Group 5: Supply Chain, Environment & Database Lockdown (Effort: ~2 hours)
- Fix SEC-06: Replace committed Upstash token in `.env.example` with placeholder.
- Fix SEC-09: Provide SQL migration script to enable Supabase RLS and revoke anon access.
- Fix SEC-14: Update vulnerable dependencies flagged by `npm audit` (`tinypool`, `braces`).
- Fix SEC-24: Add structured logger with PII redaction.

---

**AWAITING APPROVAL:** Per Rule 1 of the Rules of Engagement, no production code has been modified. Please review and approve this audit and remediation plan to proceed with Phase 3 (Fixes and Verification Tests).
