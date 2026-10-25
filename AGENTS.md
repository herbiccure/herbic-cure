# Repository Guidelines & Agent Operating Rules

## Logging & Security Rules (MANDATORY)

1. **Zero Console Statements**:
   - Never use `console.log`, `console.error`, `console.warn`, or `console.info` in `src/**`.
   - ESLint enforces `no-console: "error"` across all application code. Any new `console.*` call will break CI.

2. **Use Structured Logger**:
   - Always import `{ logger } from '@/lib/logger';` (server-only).
   - Use strict event names following the dot-separated taxonomy: `logger.info('order.created', { orderId, amount })`.
   - Use appropriate levels:
     - `error`: Unhandled failures requiring immediate action.
     - `warn`: Recoverable anomalies or retries.
     - `info`: Key business milestones (orders, payments, logins).
     - `debug`: Diagnostic details (disabled by default in production).

3. **Strict Data Redaction**:
   - Never log secrets, passwords, OTPs, auth tokens, session cookies, webhook signatures, or API keys.
   - Never log full customer phone numbers or email addresses. Use `maskPhone(phone)` or `maskEmail(email)` if correlation is necessary.
   - The logger module includes automatic recursive key-path redaction and regex pattern scrubbing.

4. **Expected Conditions Are NOT Errors**:
   - Do NOT log input validation errors (Zod), 404s, or normal rate limits as errors.
   - Never catch and log Next.js control-flow throws (`redirect()`, `notFound()`, `NEXT_REDIRECT`, `NEXT_NOT_FOUND`).

5. **External Quota Preservation**:
   - Logs go to `process.stdout` / `process.stderr` for native Vercel runtime ingestion.
   - Never write logs or telemetry counters to Upstash Redis or Supabase.
   - Permanent records (financial transactions, audit history) belong in dedicated Prisma tables (`AuditLog`, `ShipmentEvent`), not logs.

6. **Client/Server Boundary Isolation (MANDATORY)**:
   - Client components (`'use client'`) must NEVER import `src/lib/logger.ts`, `@/lib/prisma`, `@prisma/client`, `@/lib/cache/redis`, or any module containing `import 'server-only'`.
   - Client-side error reporting belongs in `@/lib/client-report` using Sentry's client SDK.
   - Shared data models, types, and fallback defaults must reside in neutral files under `src/types/` (never mixed with server database logic or logger calls).


