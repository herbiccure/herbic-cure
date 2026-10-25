# Server-Only Boundary Audit & Fix Plan (`SERVER_ONLY_FIX.md`)

## 1. Problem Statement & Error Analysis

During `npm run build`, Next.js App Router (Turbopack) halted with the following error:
```text
./src/lib/logger.ts:1:1
Error: 'server-only' cannot be imported from a Client Component module
> 1 | import 'server-only';
    | ^^^^^^^^^^^^^^^^^^^^^
  2 | import * as Sentry from '@sentry/nextjs';
  3 |
  4 | export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

It should only be used from a Server Component.
```

### Full Turbopack Import Trace
```text
Client Component Browser:
  ./src/lib/logger.ts [Client Component Browser]
  ./src/lib/footer.ts [Client Component Browser]
  ./src/app/(admin)/admin/footer/page.tsx [Client Component Browser]
  ./src/app/(admin)/admin/footer/page.tsx [Server Component]

Client Component SSR:
  ./src/lib/logger.ts [Client Component SSR]
  ./src/lib/footer.ts [Client Component SSR]
  ./src/app/(admin)/admin/footer/page.tsx [Client Component SSR]
  ./src/app/(admin)/admin/footer/page.tsx [Server Component]
```

---

## 2. Full Inventory of Detected Import Chains

A repository-wide audit of all 72 client files (`'use client'`) and their import graphs revealed 4 specific chains that pull `src/lib/logger.ts` into the browser bundle:

### Chain 1: Public Layout Footer
* **Client Component**: [`src/components/layout/Footer.tsx:8`](file:///d:/Codes/Projects/herbicCure-main/src/components/layout/Footer.tsx#L8) (`'use client'`)
* **Intermediate File**: [`src/lib/footer.ts:1`](file:///d:/Codes/Projects/herbicCure-main/src/lib/footer.ts#L1) (imports `FooterData, DEFAULT_FOOTER_DATA`)
* **Terminal Server Module**: [`src/lib/logger.ts:1`](file:///d:/Codes/Projects/herbicCure-main/src/lib/logger.ts#L1) (`import 'server-only'`)
* **Purpose of Import**: Rendering the footer links, brand details, and fallback values.

### Chain 2: Admin Footer Management
* **Client Component**: [`src/app/(admin)/admin/footer/page.tsx:24`](file:///d:/Codes/Projects/herbicCure-main/src/app/(admin)/admin/footer/page.tsx#L24) (`'use client'`)
* **Intermediate File**: [`src/lib/footer.ts:1`](file:///d:/Codes/Projects/herbicCure-main/src/lib/footer.ts#L1) (imports `FooterData, DEFAULT_FOOTER_DATA, FooterLink`)
* **Terminal Server Module**: [`src/lib/logger.ts:1`](file:///d:/Codes/Projects/herbicCure-main/src/lib/logger.ts#L1) (`import 'server-only'`)
* **Purpose of Import**: Form state initialization and TypeScript typing for footer link editing.

### Chain 3: Admin About Page Management
* **Client Component**: [`src/app/(admin)/admin/about/page.tsx:33`](file:///d:/Codes/Projects/herbicCure-main/src/app/(admin)/admin/about/page.tsx#L33) (`'use client'`)
* **Intermediate File**: [`src/lib/about.ts:1`](file:///d:/Codes/Projects/herbicCure-main/src/lib/about.ts#L1) (imports `AboutPageData, DEFAULT_ABOUT_DATA`)
* **Terminal Server Module**: [`src/lib/logger.ts:1`](file:///d:/Codes/Projects/herbicCure-main/src/lib/logger.ts#L1) (`import 'server-only'`)
* **Purpose of Import**: Form state defaults and typing for about page CMS sections.

### Chain 4: Admin Policy Page Management
* **Client Component**: [`src/app/(admin)/admin/policies/page.tsx:22`](file:///d:/Codes/Projects/herbicCure-main/src/app/(admin)/admin/policies/page.tsx#L22) (`'use client'`)
* **Intermediate File**: [`src/lib/policies.ts:2`](file:///d:/Codes/Projects/herbicCure-main/src/lib/policies.ts#L2) (imports `DEFAULT_POLICIES, PolicyData`)
* **Terminal Server Module**: [`src/lib/logger.ts:1`](file:///d:/Codes/Projects/herbicCure-main/src/lib/logger.ts#L1) (`import 'server-only'`)
* **Purpose of Import**: Default policy structures (Privacy, Terms, Shipping, Refund) and form types.

---

## 3. Root Cause

`src/lib/footer.ts`, `src/lib/about.ts`, and `src/lib/policies.ts` were designed as "mixed" modules. They housed:
1. **Pure TypeScript types & initial UI state constants** (`FooterData`, `DEFAULT_FOOTER_DATA`, `AboutPageData`, `DEFAULT_ABOUT_DATA`, `DEFAULT_POLICIES`).
2. **Server-only database queries** (`getFooterData()`, `saveFooterData()`, `getAboutPageData()`, `getPolicyData()`) that import Prisma and `src/lib/logger.ts`.

Because client components needed only the types and initial default constants, importing them from the mixed modules accidentally dragged the entire server dependency tree (including `server-only`, Node.js APIs, and `logger.ts`) into the client JavaScript bundle.

---

## 4. Architectural Fix Plan (Following Rule 2 & Principle 5)

We will NOT remove `import 'server-only'`, NOT add `'use client'` to the logger, and NOT weaken any security. Instead, we cleanly decouple pure types from server implementations:

### Step 1: Extract Neutral Type & Constant Definitions
Create neutral type definitions free of any server-only imports, Node APIs, or secrets:
- `src/types/footer.ts`: `FooterLink`, `FooterColumn`, `FooterData`, `DEFAULT_FOOTER_DATA`.
- `src/types/about.ts`: `AboutPageData`, `DEFAULT_ABOUT_DATA`.
- `src/types/policies.ts`: `PolicyItem`, `PolicyData`, `DEFAULT_POLICIES`.

### Step 2: Guard Server Modules with `server-only`
In `src/lib/footer.ts`, `src/lib/about.ts`, and `src/lib/policies.ts`:
- Add `import 'server-only';` at the top to strictly prevent any future client imports.
- Re-export the types from `src/types/...` for backwards compatibility with server route handlers.
- Keep all database querying and `logger.debug` logic strictly on the server.

### Step 3: Update Client Components
Update the 4 client components to import their interfaces and default constants exclusively from `src/types/...`:
- [`src/components/layout/Footer.tsx`](file:///d:/Codes/Projects/herbicCure-main/src/components/layout/Footer.tsx) -> `from '@/types/footer'`
- [`src/app/(admin)/admin/footer/page.tsx`](file:///d:/Codes/Projects/herbicCure-main/src/app/(admin)/admin/footer/page.tsx) -> `from '@/types/footer'`
- [`src/app/(admin)/admin/about/page.tsx`](file:///d:/Codes/Projects/herbicCure-main/src/app/(admin)/admin/about/page.tsx) -> `from '@/types/about'`
- [`src/app/(admin)/admin/policies/page.tsx`](file:///d:/Codes/Projects/herbicCure-main/src/app/(admin)/admin/policies/page.tsx) -> `from '@/types/policies'`

### Step 4: Client Reporting Module
Create [`src/lib/client-report.ts`](file:///d:/Codes/Projects/herbicCure-main/src/lib/client-report.ts) (client-safe, no `server-only`) for any browser exception reporting to Sentry using the client SDK.

### Step 5: Enforce Prevention via ESLint & Vitest
- Update [`eslint.config.mjs`](file:///d:/Codes/Projects/herbicCure-main/eslint.config.mjs) using `no-restricted-imports` so that any file with `'use client'` cannot import `@/lib/logger`, `@prisma/client`, or server-only modules.
- Create [`tests/server-only-boundary.test.ts`](file:///d:/Codes/Projects/herbicCure-main/tests/server-only-boundary.test.ts) to verify that zero client components import restricted server modules.
- Verify `npm run build` succeeds with zero errors.
