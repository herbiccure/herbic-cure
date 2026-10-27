# Structured Logging & Telemetry Guide

## 1. Overview & Architecture

Herbic Cure uses a high-performance, zero-leak, zero-noise structured logging architecture designed specifically for Next.js App Router on Vercel serverless environments.

- **Module**: `src/lib/logger.ts` (enforced via `import 'server-only'`)
- **Transport**: Compact JSON strings written directly to `process.stdout` / `process.stderr` for native Vercel runtime log ingestion.
- **Error Tracking**: Sampled exception capture (5% trace rate) through `@sentry/nextjs` with header & token scrubbing.
- **Enforcement**: ESLint flat config (`eslint.config.mjs`) strictly bans `console.*` statements across `src/**`.

---

## 2. Log Levels & Semantics

| Level | Purpose | Default In Production? | When To Use |
| :--- | :--- | :---: | :--- |
| **`error`** | Operation failure requiring intervention | **Yes** | Webhook verification failure, shipment creation rejected, database mutation error, unhandled 5xx exception. |
| **`warn`** | Handled anomalies or recoverable failures | **Yes** | Network timeout on retry, fallback used, suspicious payload, throttled repeats. |
| **`info`** | High-value business & audit milestones | **Yes** | Order placed, payment verified, refund issued, admin login success, role changed. Low volume only. |
| **`debug`** | Diagnostic troubleshooting data | **No** (dev only) | ISR fallback queries during build, detailed route parameters, cache miss details. |

### Environment Control
- **`LOG_LEVEL`**: Configurable via environment variables (`debug` \| `info` \| `warn` \| `error`).
- Default in Production: `info`
- Default in Development: `debug`

### Where to Log From (Server Logger vs. Client Reporting vs. Server Actions)

1. **Server-Side Code (Route Handlers, Server Components, Backend Libs)**:
   - Import `{ logger } from '@/lib/logger';` (enforced via `server-only`).
   - Writes structured JSON to stdout/stderr with deep redaction, correlation IDs, and rate throttling.
2. **Client-Side Code (Components with `'use client'`, Hooks, Contexts)**:
   - Import `{ reportClientError, reportClientMessage } from '@/lib/client-report';`.
   - Reports exceptions to Sentry client SDK without pulling server-only code, Node APIs, or secrets into the browser.
3. **Important Client-Side Business Events (Checkout failures, fraud alerts)**:
   - Dispatch an authenticated Server Action or API route.
   - Server validates payload via Zod, checks session/rate limits, and emits the log from the server boundary.

---

## 3. "Log or Don't Log" Decision Matrix

### ✅ What to Log
1. **Business Events**: Milestone events with internal IDs (`orderId`, `userId`, `shipmentId`, `paymentId`).
2. **External Gateway Failures**: Razorpay / Delhivery / Supabase errors with status codes and execution duration (`durationMs`).
3. **Audit Actions**: Admin authentication, setting modifications, staff role changes.
4. **Actionable Failures**: Structured error message and top stack trace frames.

### 🚫 What NEVER to Log
1. **Secrets & Credentials**: Passwords, OTPs, session cookies, Bearer tokens, JWTs, Razorpay secret keys, Delhivery tokens, database connection passwords.
2. **Customer PII**: Full customer phone numbers (use `maskPhone()` for `***1234`), full email addresses (use `maskEmail()`), physical delivery addresses.
3. **High-Volume Chatter**: Static asset fetches, health check pings, cache hits, successful catalog queries (`GET /products`), page renders.
4. **Loops**: Never place log statements inside `for`, `forEach`, or `while` loops. Log a single summary with counts before/after the loop.
5. **Expected Conditions**: 404 Not Found, input validation errors (Zod failures), normal rate-limit rejections (HTTP 429), and Next.js control-flow exceptions (`redirect()`, `notFound()`, `NEXT_REDIRECT`, `NEXT_NOT_FOUND`).

---

## 4. Event Name Catalog

All log events must follow dot-separated, lowercase naming conventions:

### Authentication (`auth.*`)
- `auth.admin.login.success`: Admin authenticated via session.
- `auth.admin.login.failed`: Admin login attempt rejected (invalid credentials).
- `auth.customer.login.success`: Customer logged in via phone/OTP.
- `auth.customer.otp_dispatched`: OTP successfully sent via SMS gateway.
- `auth.customer.register.success`: New customer account created.

### Orders & Checkout (`order.*`)
- `order.created`: New checkout order placed (COD or prepaid initialized).
- `order.cancelled`: Order cancelled and inventory restocked.
- `order.payment_verified`: Prepaid order confirmed via payment gateway.
- `order.status_updated`: Fulfillment status updated (e.g., PACKED, SHIPPED).

### Payment Gateway (`payment.*`)
- `payment.order.created`: Razorpay order initialized with amount & currency.
- `payment.webhook.received`: Webhook payload received from Razorpay.
- `payment.webhook.processed`: Webhook event processed (e.g., `payment.captured`).
- `payment.signature_mismatch`: Invalid webhook or client signature detected.
- `payment.order.failed`: Gateway error during order creation.

### Shipping & Logistics (`shipping.*`)
- `shipping.delhivery.serviceability_checked`: Pincode serviceability evaluated.
- `shipping.manifest.created`: Shipment registered and AWB assigned.
- `shipping.manifest.failed`: Delhivery rejected shipment creation.
- `shipping.pickup.scheduled`: Warehouse pickup list requested.
- `shipping.webhook.received`: Delhivery scan update webhook processed.

### Admin Operations (`admin.*`)
- `admin.settings.updated`: Site settings or SEO defaults modified.
- `admin.product.updated`: Catalog product created, updated, or removed.
- `admin.upload.success`: Media asset uploaded to cloud storage.

---

## 5. Good vs Bad Logging Examples

### ❌ Bad: Leaking PII and Dumping Objects
```typescript
// BAD: Leaks OTP, phone number, and dumps entire user object
console.log('User logged in:', user);
console.log('Sending OTP ' + otp + ' to ' + phone);
```

### ✅ Good: Redacted, Structured Event
```typescript
// GOOD: Structured JSON, masked identifiers, correlation IDs
logger.info('auth.customer.login.success', {
  userId: user.id,
  phoneMasked: maskPhone(phone),
});
```

### ❌ Bad: Logging Inside Loops
```typescript
// BAD: Generates hundreds of log lines for a bulk order
for (const item of order.items) {
  console.log(`Processing item ${item.id} for order ${order.id}`);
}
```

### ✅ Good: Aggregated Summary Log
```typescript
// GOOD: Single line with item count
logger.info('order.items.processed', {
  orderId: order.id,
  itemCount: order.items.length,
});
```

### ❌ Bad: Logging Expected 404s or Next.js Control-Flow
```typescript
// BAD: Next.js redirect() throws a special error which floods error logs
try {
  redirect('/login');
} catch (err) {
  console.error('Redirect failed:', err); // POLLUTES SENTRY AND LOGS
}
```

### ✅ Good: Let Framework Handle Control Flow
```typescript
// GOOD: redirect() is allowed to complete without catch or logged as error
redirect('/login');
```

---

## 6. How to Inspect Logs

### Vercel Runtime Logs
1. Navigate to **Vercel Dashboard** > **Projects** > **herbic-cure** > **Logs**.
2. Filter by search query:
   - Specific order: `orderId:"ord_..."`
   - Specific event: `event:"payment.webhook.processed"`
   - Errors only: `level:error`

### Sentry Error Tracking
1. Navigate to **Sentry Dashboard** > **herbic-cure** > **Issues**.
2. Search by event tag: `event:payment.webhook.processed` or `requestId:...`.
3. Filter out noise using the configured `ignoreErrors` rules.

---

## 7. How to Temporarily Raise LOG_LEVEL

If investigating an issue in production:
1. In Vercel Project Settings > **Environment Variables**:
   - Set `LOG_LEVEL` = `debug` (Environment: Production).
2. Redeploy the latest production deployment (no build needed).
3. Reproduce the scenario and inspect detailed `debug` events.
4. **IMPORTANT**: Immediately change `LOG_LEVEL` back to `info` and redeploy to prevent log quota exhaustion.

---

## 8. Provider Retention Limits & Quota Protection

| Provider | Plan | Retention Window | Best Practice |
| :--- | :--- | :--- | :--- |
| **Vercel Runtime Logs** | Hobby | 1 Hour | Ephemeral debugging only. Never rely on logs for compliance. |
| **Vercel Runtime Logs** | Pro | 1 - 3 Days (up to 7 days with Log Drain) | Use external drain (Axiom, Datadog) if audit archives required. |
| **Sentry** | Developer / Team | 30 - 90 Days | Sampled at 5% traces to stay within monthly event quotas. |
| **Upstash Redis** | Free Tier | Monthly command quota (10,000 commands/day) | **Never** use Redis as a log counter. Use in-memory throttling. |
| **PostgreSQL Database** | Supabase | Permanent (per table retention) | Permanent business records belong in `AuditLog` and `ShipmentEvent` tables. |

---

## 9. Actionable Alert Catalog

To prevent alert fatigue, configure alerts ONLY for critical, actionable issues:

1. **`payment.signature_mismatch` spike**: > 3 events in 10 minutes indicates possible tampering or webhook key misconfiguration.
2. **`payment.order.failed`**: Any spike indicates Razorpay API downtime or balance depletion.
3. **`shipping.manifest.failed`**: Repeated failures indicate invalid warehouse address or Delhivery token expiration.
4. **Repeated 5xx Spike**: > 1% of total request volume in a 5-minute rolling window.
5. **`auth.admin.login.failed` burst**: > 5 failures from a single IP within 15 minutes indicates a brute-force attack.
