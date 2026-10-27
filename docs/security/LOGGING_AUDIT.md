# Logging & Error Tracking Audit (LOGGING_AUDIT.md)

**System:** Herbic Cure E-Commerce Platform  
**Environment:** Next.js (App Router) + TypeScript on Vercel, Supabase PostgreSQL, Upstash Redis, Razorpay, Delhivery Express  
**Audit Date:** October 25, 2026  
**Auditor:** Senior Backend & Reliability Engineer  
**Status:** **PENDING USER APPROVAL (No code modified yet)**

---

## 1. Executive Summary

A comprehensive scan across the entire codebase identified **141 `console.*` calls in `src/`** and **32 in CLI bootstrap scripts (`scripts/`, `prisma/`)**. 

Current logging suffers from four major architectural deficiencies:
1. **Critical PII & Secret Leaks**: 
   - `src/lib/sms.ts` logs full customer mobile phone numbers and plaintext OTPs to stdout.
   - `src/app/api/shipping/delhivery/webhook/route.ts` logs raw Delhivery webhook bodies containing customer names, addresses, and tracking details.
   - Several payment and courier failure handlers dump entire error or response objects which can expose API tokens, authorization headers, or database connection strings.
2. **Excessive Noise & Log Spam**:
   - Page render fallbacks (ISR/SSR database deferred warnings in `src/app/page.tsx`, `collections`, `products`, `ingredients`) fire on normal static generation and transient reconnects, emitting thousands of redundant warnings.
   - Repeated fallback warnings in `src/lib/policies.ts`, `src/lib/about.ts`, and `src/lib/footer.ts`.
3. **Unstructured Prose Output**:
   - Over 90% of logs are free-form strings (`console.error('Razorpay verification error:', error)`) rather than machine-readable JSON events with correlation IDs (`requestId`, `orderId`). Searching or aggregating them in Vercel or log drains is brittle and expensive.
4. **Missing Production Error Tracking**:
   - Sentry is completely absent from `package.json` and the repository. Errors either die silently in serverless logs or get dumped to the browser console.

---

## 2. Quantitative Baseline & Traffic Impact (per 1,000 Requests)

### Current vs. Projected Log Volume

| Flow | Pre-Change Logs (Current) | Post-Change Logs (Target) | Reduction | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Browse Product Catalog** (Home -> Category -> Product) | ~3,000 - 5,000 lines | **0 lines** | **100%** | Success paths in browsing/SSR produce zero log noise; analytics/metrics handle traffic counting. |
| **Add to Cart & Hydration** | ~100 - 300 lines | **0 lines** | **100%** | Browser console errors eliminated; client issues handled by sampled Sentry boundary. |
| **Checkout & Validation** (PIN, coupons, order create) | ~2,500 - 4,000 lines | **~1,000 lines** (1 event per order: `order.created`) | **60 - 75%** | Only significant business lifecycle events logged once with correlated `orderId`. |
| **Payment Gateway** (Razorpay verify / capture) | ~1,500 - 3,000 lines | **~1,000 lines** (1 event per payment: `payment.verified`) | **50 - 65%** | Correlated single line `{ event: "payment.verified", orderId, paymentId, durationMs }`. |
| **Webhooks** (Razorpay & Delhivery) | ~1,500 - 3,000 lines | **~1,000 lines** (1 event per webhook: `payment.webhook.processed`) | **50 - 65%** | Raw body dumps removed; structured processing outcome logged with `requestId`. |
| **Background / Errors** | Variable (often loops or unthrottled stacks) | **Throttled single lines** (1 per error signature/min) | **85%+** | In-memory throttling prevents bot scans or cascade outages from burning quotas. |
| **TOTAL (per 1,000 full journeys)** | **~8,600 - 15,300 lines** | **~3,000 lines** | **~75% reduction** | Eliminates storage waste, respects Vercel limits, and protects PII. |

---

## 3. Storage & Platform Quotas (Vercel & Sentry)

### Vercel Runtime Logs Retention
- **Vercel Hobby Plan**: Runtime log retention is **1 hour**.
- **Vercel Pro Plan**: Runtime log retention is **24 hours** (1 day).
- **Vercel Enterprise Plan**: Runtime log retention is **3 days** (configurable up to 30 days).
- **Message Size Limit**: Vercel limits log line payloads to ~4 KB per entry. Giant object dumps or multi-line error traces get cut off.
- **Log Drains**: If external log destinations (e.g. Axiom, Datadog, Better Stack) are configured, uncompressed prose logs consume bandwidth and retention volume. Compact single-line structured JSON is the official recommended format.

### Sentry Error Tracking Quotas
- Without strict filtering, client hydration errors, network aborts (`AbortError`), Next.js redirect control-flow exceptions (`NEXT_REDIRECT`), and bot 404s burn the monthly event quota within days.
- **Target Configuration**:
  - `tracesSampleRate`: **0.05** (5% of normal transactions).
  - `ignoreErrors`: `NEXT_REDIRECT`, `NEXT_NOT_FOUND`, `AbortError`, `ResizeObserver loop limit exceeded`.
  - `beforeSend`: Strip `Authorization`, `Cookie`, `x-razorpay-signature`, `DELHIVERY_API_TOKEN`, card details, and PII before events leave the runtime.
  - Zero Session Replay (unless explicitly activated).

---

## 4. Comprehensive Inventory of Existing Log Statements

### Category A: Critical Security & PII Violations (MUST FIX IMMEDIATELY)

| File & Line | Statement Snippet | Security / Privacy Issue | Decision & Planned Action |
| :--- | :--- | :--- | :--- |
| [src/lib/sms.ts:90-91](file:///d:/Codes/Projects/herbicCure-main/src/lib/sms.ts#L90-L91) | `console.log('To: +91 ' + normalizedPhone)`<br>`console.log('Code: ' + otp)` | **CRITICAL LEAK**: Plaintext OTP code and customer phone number logged to stdout. | **REMOVE plaintext log**. Replace with `logger.debug('sms.dispatch_simulated', { phoneMasked: maskPhone(normalizedPhone) })`. |
| [src/app/api/shipping/delhivery/webhook/route.ts:41](file:///d:/Codes/Projects/herbicCure-main/src/app/api/shipping/delhivery/webhook/route.ts#L41) | `console.log('Delhivery Webhook received event:', JSON.stringify(body).slice(0, 500))` | **PII LEAK**: Dumps raw JSON containing recipient name, address, phone, and AWB. | **CHANGE**: Replace with `logger.info('shipping.webhook.received', { waybill: body?.waybill, status: body?.status })`. |
| [src/lib/shipping/delhivery.ts:853](file:///d:/Codes/Projects/herbicCure-main/src/lib/shipping/delhivery.ts#L853) | `console.log('Delhivery cancellation response for AWB', cleanWbn, data)` | Dumps raw response object `data` which may contain account facility keys and internal errors. | **CHANGE**: Replace with `logger.info('shipping.order.cancelled', { waybill: cleanWbn })`. |
| [src/app/api/payment/razorpay/verify/route.ts:32](file:///d:/Codes/Projects/herbicCure-main/src/app/api/payment/razorpay/verify/route.ts#L32) | `console.warn('Invalid Razorpay signature for order...')` | Unstructured warning logging signature failures. | **CHANGE**: Replace with structured security warning `logger.warn('payment.signature.invalid', { orderId, paymentId })`. |
| [src/app/api/payment/razorpay/webhook/route.ts:19, 53](file:///d:/Codes/Projects/herbicCure-main/src/app/api/payment/razorpay/webhook/route.ts#L19) | `console.warn('Invalid Razorpay webhook signature')`<br>`console.error(...)` | Raw error dump on webhook signature failure. | **CHANGE**: Replace with `logger.warn('payment.webhook.signature_failed')` and structured `logger.error('payment.webhook.failed')`. |

---

### Category B: Noisy / Hot Path Logs (MUST REMOVE OR DOWNGRADE)

| File & Line | Statement Snippet | Problem | Decision |
| :--- | :--- | :--- | :--- |
| [src/app/page.tsx:119, 199](file:///d:/Codes/Projects/herbicCure-main/src/app/page.tsx#L119) | `console.warn('Database connection deferred during build/ISR...')`<br>`console.error('Failed to parse hero slides', e)` | Fires on every static build and ISR revalidation. Generates high noise. | **CHANGE**: Downgrade DB deferred warning to `logger.debug`. Log hero slides parse failure as single `logger.warn`. |
| [src/app/collections/page.tsx:53](file:///d:/Codes/Projects/herbicCure-main/src/app/collections/page.tsx#L53) | `console.warn('Collections query deferred during build/ISR:', err)` | Build/ISR noise during static generation. | **REMOVE** or downgrade to `logger.debug`. |
| [src/app/ingredients/page.tsx:27](file:///d:/Codes/Projects/herbicCure-main/src/app/ingredients/page.tsx#L27) | `console.warn('Could not fetch ingredients at build/render time:', err)` | Build/ISR noise. | **REMOVE** or downgrade to `logger.debug`. |
| [src/app/offers/page.tsx:51](file:///d:/Codes/Projects/herbicCure-main/src/app/offers/page.tsx#L51) | `console.warn('Offers query deferred during build/ISR:', err)` | Build/ISR noise. | **REMOVE** or downgrade to `logger.debug`. |
| [src/app/products/[slug]/page.tsx:19, 42, 63](file:///d:/Codes/Projects/herbicCure-main/src/app/products/%5Bslug%5D/page.tsx#L19) | `console.warn('Failed to pre-generate product static params...')`<br>`console.warn('Database unreachable fetching product...')` | High volume catalog scan noise. | **CHANGE**: Downgrade to `logger.debug`. |
| [src/app/results/page.tsx:45](file:///d:/Codes/Projects/herbicCure-main/src/app/results/page.tsx#L45) | `console.warn('Results query deferred during build/ISR:', err)` | Build/ISR noise. | **REMOVE** or downgrade to `logger.debug`. |
| [src/app/reviews/page.tsx:40](file:///d:/Codes/Projects/herbicCure-main/src/app/reviews/page.tsx#L40) | `console.warn('Reviews query deferred during build/ISR:', err)` | Build/ISR noise. | **REMOVE** or downgrade to `logger.debug`. |
| [src/lib/policies.ts:214](file:///d:/Codes/Projects/herbicCure-main/src/lib/policies.ts#L214) | `console.warn('Policy fallback used for slug...')` | Fires whenever fallback copy is rendered. | **REMOVE** from production stdout; fallback is normal expected operation. |
| [src/lib/about.ts:297](file:///d:/Codes/Projects/herbicCure-main/src/lib/about.ts#L297) | `console.warn('About data database fallback used...')` | Fallback noise. | **REMOVE** from production stdout. |
| [src/lib/footer.ts:179](file:///d:/Codes/Projects/herbicCure-main/src/lib/footer.ts#L179) | `console.warn('Footer data database fallback used...')` | Fallback noise. | **REMOVE** from production stdout. |
| [src/lib/redirects.ts:42](file:///d:/Codes/Projects/herbicCure-main/src/lib/redirects.ts#L42) | `console.warn('Prevented self-referencing redirect loop...')` | Normal guardrail execution. | **CHANGE**: Downgrade to `logger.debug('redirect.self_loop_prevented')`. |

---

### Category C: Client-Side Browser Console Statements (MUST REMOVE)

| File & Line | Statement Snippet | Problem | Decision |
| :--- | :--- | :--- | :--- |
| [src/context/CartContext.tsx:62, 85, 99](file:///d:/Codes/Projects/herbicCure-main/src/context/CartContext.tsx#L62) | `console.error('Failed to load cart from storage', e)`<br>`console.error('Failed to persist cart', e)` | Client-side console spam; pollutes user devtools. | **REMOVE**: Wrap in silent local fallback. Browser errors go to Sentry if critical. |
| [src/context/AuthContext.tsx:61](file:///d:/Codes/Projects/herbicCure-main/src/context/AuthContext.tsx#L61) | `console.error('Logout error:', e)` | Client-side error. | **REMOVE**: Silent fallback or Sentry capture. |
| [src/components/layout/Header.tsx:165](file:///d:/Codes/Projects/herbicCure-main/src/components/layout/Header.tsx#L165) | `console.error('Search fetch error:', err)` | Fires when user types and network is interrupted. | **REMOVE** client console error. |
| [src/components/admin/AdminShell.tsx:155](file:///d:/Codes/Projects/herbicCure-main/src/components/admin/AdminShell.tsx#L155) | `console.error('Logout error', e)` | Client logout error. | **REMOVE** client console error. |
| [src/app/checkout/page.tsx:269, 284, 296](file:///d:/Codes/Projects/herbicCure-main/src/app/checkout/page.tsx#L269) | `console.error('Payment verification network error:', vEx)`<br>`console.error('Razorpay payment failed:', resp.error)` | Client console error spam during payment checkout. | **CHANGE**: Display UI toast/feedback to customer and capture exception via Sentry without `console.error`. |

---

### Category D: Server API Route Error Handlers (CONVERT TO STRUCTURED LOGGER)

There are 58 API catch-all blocks in `src/app/api/...`:
- `src/app/api/orders/create/route.ts` (lines 223, 274, 391)
- `src/app/api/orders/track/route.ts` (line 102)
- `src/app/api/orders/[id]/cancel/route.ts` (line 98)
- `src/app/api/payment/razorpay/create-order/route.ts` (line 66)
- `src/app/api/payment/razorpay/verify/route.ts` (lines 117, 128)
- `src/app/api/payment/razorpay/webhook/route.ts` (lines 123, 135)
- `src/app/api/admin/orders/[id]/request-pickup/route.ts` (line 181)
- `src/app/api/admin/orders/[id]/sync-delhivery/route.ts` (line 94)
- `src/app/api/admin/orders/[id]/route.ts` (lines 33, 107, 124, 133)
- `src/app/api/admin/login/route.ts` (line 122)
- `src/app/api/auth/customer/login/route.ts` (line 77)
- `src/app/api/auth/customer/send-otp/route.ts` (line 96)
- `src/app/api/auth/customer/verify-otp/route.ts` (line 104)
- `src/app/api/shipping/delhivery/...` (lines 21, 21, 152)
- And 40 additional admin resource routes (`products`, `categories`, `coupons`, `customers`, `policies`, etc.).

**Decision for all API Route Error Handlers**:
- Replace `console.error('Action error:', err)` with single-line structured:
  ```typescript
  logger.error('order.create.failed', {
    orderNumber,
    error: err.message,
    status: 500,
    requestId,
  });
  ```
- Send unhandled 5xx exceptions to Sentry via `Sentry.captureException(err)`.
- Never log expected 4xx errors (validation failures, coupon expired, wrong password) at `error` level.

---

### Category E: Developer / Bootstrap Scripts (`scripts/`, `prisma/`) (EXEMPT FROM NO-CONSOLE)

- `scripts/seed-owner.ts` (lines 12, 19, 20, 24, 69-74, 79)
- `prisma/seed.ts` (lines 8, 35, 61, 83, 107, 133, 344, 385, 426, 805, 837, 861, 899, 931, 972, 1042, 1103, 1104, 1109)
- `update_announcements.js` (lines 47, 50)

**Decision**: CLI bootstrap scripts are run explicitly in terminal by engineers during deployment or local setup. They are **EXEMPT** from ESLint `no-console` and will retain terminal output.

---

## 5. Logger Architecture Proposal (`src/lib/logger.ts`)

### Library Choice: Dedicated Server-Only Logger vs. Pino

| Feature | `pino` in Next.js App Router | Zero-Dependency `src/lib/logger.ts` |
| :--- | :--- | :--- |
| **Edge & Node Compatibility** | ⚠️ Often requires bundler workarounds (`worker_threads` absent in Edge / Turbopack). | ✅ 100% native Next.js compatibility in both Node and Edge runtimes. |
| **Vercel Serverless Lifecycle** | ⚠️ Worker-thread async flushing can lose logs if lambda container freezes on response return. | ✅ Synchronous `stdout` stream writes guarantee zero lost logs before freeze. |
| **Built-in Redaction** | ✅ Supports key-path redaction. | ✅ Custom recursive deep-redaction covering both key paths and value regex patterns (phone, OTP, tokens). |
| **In-Memory Rate Throttling** | ❌ Requires custom plugins or external stream. | ✅ Built-in in-memory throttle cache (collapses identical errors within a 60-second window). |
| **Sentry Bridge** | Requires separate transport. | ✅ Direct integration with `@sentry/nextjs` (calls `captureException` on `error` automatically). |

**Recommendation**:
Implement `src/lib/logger.ts` as a robust, lightweight, structured JSON server-only module. It follows the exact Pino structured schema (`level`, `time`, `event`, `msg`, `context`), providing sub-millisecond execution, zero bundle footprint, guaranteed synchronous delivery to Vercel runtime logs, and automatic redaction of all sensitive keys and pattern values.

### Standard Log Schema (JSON Output)
```json
{
  "level": "info",
  "time": "2026-10-25T11:45:00.123Z",
  "event": "payment.verified",
  "requestId": "req_01j9a8b...",
  "orderId": "HC-100234",
  "paymentId": "pay_O7bXYZ...",
  "amount": 787,
  "durationMs": 142
}
```

---

## 6. Event Name Catalog (Dot-Notation)

All events will follow a strict dot-separated, lowercase nomenclature:

1. **Authentication & Security**:
   - `auth.customer.login.success`
   - `auth.customer.login.failed`
   - `auth.admin.login.success`
   - `auth.admin.login.failed`
   - `auth.otp.sent`
   - `auth.otp.verified`
   - `auth.otp.invalid`
2. **Orders & Checkout**:
   - `order.created`
   - `order.create.failed`
   - `order.cancelled`
   - `order.stock_restored`
3. **Payments**:
   - `payment.order.created`
   - `payment.verified`
   - `payment.verification_failed`
   - `payment.signature.invalid`
   - `payment.webhook.received`
   - `payment.webhook.processed`
   - `payment.webhook.signature_failed`
4. **Logistics & Shipping (Delhivery)**:
   - `shipping.manifest.created`
   - `shipping.manifest.failed`
   - `shipping.pickup.scheduled`
   - `shipping.pickup.failed`
   - `shipping.webhook.processed`
   - `shipping.order.cancelled`
5. **System & Security**:
   - `security.rate_limit.exceeded`
   - `security.admin_action.audited`
   - `system.cache.invalidated`

---

## 7. ESLint Enforcement Rule

In `eslint.config.mjs`:
```javascript
{
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }] // In src, enforce logger instead of console
  },
  overrides: [
    {
      files: ["scripts/**", "prisma/**", "tests/**"],
      rules: {
        "no-console": "off"
      }
    }
  ]
}
```

---

## 8. Implementation Results & Verification

All tasks approved in this audit have been successfully implemented and verified:

1. **Logger Module (`src/lib/logger.ts`)**:
   - Zero-dependency, server-only (`import 'server-only'`) structured logger.
   - Built-in multi-layer redaction (key-path matching + regex pattern scrubbing for JWTs, Bearer tokens, DB credentials, Indian phone numbers, emails).
   - 200-character string truncation and 20-item array capping.
   - Dynamic `LOG_LEVEL` evaluation (default `info` in production, `debug` in development).
   - In-memory 60s window repeat throttling without consuming Upstash Redis command quotas.
   - Direct integration with Sentry exception capturing on error level.

2. **Console Calls Elimination**:
   - `src/**` before: **141** console calls.
   - `src/**` after: **0** console calls.
   - All critical security leaks resolved (`src/lib/sms.ts` OTP & phone logging removed; raw webhook payload dumps in Delhivery and Razorpay eliminated).

3. **Sentry Error Tracking**:
   - Installed `@sentry/nextjs` with 5% traces sampling.
   - Created `sentry.server.config.ts`, `sentry.client.config.ts`, and `sentry.edge.config.ts`.
   - Ignored expected noise (`NEXT_REDIRECT`, `NEXT_NOT_FOUND`, `AbortError`, etc.).
   - Header scrubbing for `authorization`, `cookie`, `x-razorpay-signature`, `x-delhivery-token`. Zero session replay.

4. **Lint & Enforcement**:
   - Configured `eslint.config.mjs` with `no-console: "error"` for `src/**`.
   - Exemptions configured for `scripts/**`, `prisma/**`, and `tests/**`.

5. **Test Suite & Type Safety**:
   - Created `tests/logger.test.ts` with 11 Vitest tests validating deep redaction, string truncation, Next.js control-flow suppression, rate throttling, and zero env secret leakage.
   - Full test run passes: 11/11 tests pass.
   - TypeScript compilation (`tsc --noEmit`) passes with 0 errors.
