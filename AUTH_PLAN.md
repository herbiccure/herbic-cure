# Herbic Cure — Authentication, Authorization, Customer Account, Admin Panel & Caching System Architecture Plan (AUTH_PLAN.md)

**System Role**: Senior Full-Stack & Application Security Engineer  
**Target Environment**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM + PostgreSQL, Upstash Redis, Cloudflare CDN  
**Security Philosophy**: **Defense-in-Depth, Deny-by-Default, Zero-Trust DAL, Zero Leaked Cache**  
**Compliance & Governance**: India Digital Personal Data Protection Act (DPDP Act, 2023), OWASP ASVS 4.0, PCI-DSS principles

---

## 1. Executive Summary & Security Philosophy

Herbic Cure is an Ayurvedic hair care e-commerce platform operating in India. In e-commerce, **correctness, data integrity, and customer trust supersede raw performance**:
1. A cache must **never** serve another customer’s private data, an unauthorized role’s view, or a stale price at payment.
2. A revoked permission or deactivated staff member must take effect **instantly on the next request**, regardless of cached layers.
3. Every operation follows **Defense in Depth**: if one layer fails (e.g. client check or edge middleware), the next layer (server action wrapper, then Data Access Layer, then database constraint) **must catch and reject the violation**.
4. **Deny by Default**:
   - Any route, action, or resource not explicitly permitted is forbidden.
   - Any data not explicitly allowlisted as public static content is **never cached**.

---

## 2. Technology Stack & Library Selection (with Justifications)

| Domain | Selected Library / Tool | Justification & Comparison |
| :--- | :--- | :--- |
| **Authentication Engine** | **Better Auth** (`better-auth`) | **Chosen over Auth.js v5**. Better Auth provides native Prisma adapter, built-in TOTP two-factor authentication plugin with hashed backup codes, admin/roles plugin, multi-session management ("revoke other devices", active sessions list), and rate limiting hooks out-of-the-box. Auth.js v5 requires hand-rolling custom TOTP tables, complex credentials handling, and manual session revocation logic. Better Auth eliminates custom crypto/session logic. |
| **Password Hashing** | **Argon2id** via `@node-rs/argon2` | Argon2id is the gold standard for password hashing (winner of the Password Hashing Competition), offering superior memory-hardness against GPU/ASIC attacks compared to bcrypt. Configured with $m=65536$ (64 MB), $t=3$, $p=4$. |
| **Password Strength & Breach Check** | **zxcvbn-ts** + **HIBP k-Anonymity API** | Eliminates composition theatrics (e.g., forcing special characters) in favor of true entropy calculation and checks against HaveIBeenPwned's 5-character SHA-1 prefix k-anonymity API without exposing password material. |
| **Input Validation** | **Zod** (`zod`) + `react-hook-form` + `@hookform/resolvers/zod` | Runtime type safety and schema validation across every layer: query params, route bodies, Server Actions, environment variables, and cache keys. |
| **Server Action Pipeline** | **next-safe-action** (`next-safe-action`) | Guarantees that every server mutation executes strictly through a verified middleware chain: `Rate Limit -> Session Auth -> Role Permission -> Zod Validation -> Mutation Execution`. |
| **Authorization & Permissions** | **Typed Permission Map** + **CASL Ability** (`@casl/ability`) | Static TypeScript enum/matrix for static permissions; CASL rules for attribute-based conditions (e.g., refund amounts below threshold, viewing own orders, SUPPORT editing order status up to SHIPPED). |
| **Distributed Rate Limiting & Lock Store** | **@upstash/ratelimit** + **@upstash/redis** | Edge-compatible distributed rate limiting on login, OTP, checkout, and admin endpoints with sliding window algorithms and atomic Redis `SET NX EX` single-flight stampede locks. |
| **Server-Only Guards** | **server-only** | Enforced at the top of every DAL module, auth service, and cache invalidation utility to make it impossible for sensitive server logic or DB calls to leak into client bundles. |
| **Admin UI Foundations** | **shadcn/ui** + **TanStack Table v9** + **TanStack Query v5** + **Recharts** | Accessible, headless UI primitives with server-side pagination, sorting, filtering, and query state caching. |
| **Email & SMS OTP (India)** | **Resend / Nodemailer** (Email) + **MSG91 / Twilio Verify** (Phone OTP) | Secure template delivery for verification links, single-use password resets, and DLT-compliant Indian transactional SMS OTPs. |
| **Testing Suite** | **Vitest** (Unit/DAL/Matrix) + **Playwright** (E2E/Security) | Matrix generation testing all role $\times$ resource $\times$ action combinations; automated regression testing for IDOR, token reuse, and cache poisoning. |

---

## 3. Prisma Data Model (PostgreSQL)

### 3.1 Migration from SQLite to PostgreSQL
The project database currently runs on SQLite (`dev.db`). For enterprise security, transaction guarantees, row-level locking, and enum support, we migrate to PostgreSQL:
1. Update `prisma/schema.prisma` `datasource db { provider = "postgresql", url = env("DATABASE_URL") }`.
2. Map all SQLite-specific types to PostgreSQL native types (`enum`, `timestamp(3) with time zone`, `jsonb`, `uuid`).
3. Apply schema migration via `npx prisma migrate dev --name init_postgres`.

### 3.2 Complete Schema Specification

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// =========================================================================
// 1. IDENTITY, ROLES & SESSIONS (BETTER AUTH COMPATIBLE)
// =========================================================================

enum Role {
  CUSTOMER
  SUPPORT
  MANAGER
  OWNER
}

enum UserStatus {
  ACTIVE
  INVITED
  SUSPENDED
  DEACTIVATED
}

model User {
  id               String      @id @default(uuid())
  name             String
  email            String      @unique
  emailVerified    Boolean     @default(false)
  image            String?
  phone            String?     @unique
  phoneVerified    Boolean     @default(false)
  role             Role        @default(CUSTOMER)
  status           UserStatus  @default(ACTIVE)
  twoFactorEnabled Boolean     @default(false)
  lastLoginAt      DateTime?
  lastActiveAt     DateTime?
  failedLoginAttempts Int      @default(0)
  lockedUntil      DateTime?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  // Optimistic concurrency
  version          Int         @default(1)

  // Relations
  accounts         Account[]
  sessions         Session[]
  twoFactorSecret  TwoFactorSecret?
  backupCodes      BackupCode[]
  addresses        Address[]
  orders           Order[]
  reviews          Review[]
  invitesSent      StaffInvite[]    @relation("InvitedByStaff")
  auditLogs        AuditLog[]       @relation("ActorAuditLogs")

  @@index([email])
  @@index([phone])
  @@index([role, status])
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  impersonatedBy String? // For temporary audit if authorized
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([token])
}

model Account {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId    String
  providerId   String
  passwordHash String?  // Argon2id hash for credential provider
  accessToken  String?
  refreshToken String?
  idToken      String?
  expiresAt    DateTime?
  passwordResetRequired Boolean @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([providerId, accountId])
  @@index([userId])
}

model VerificationToken {
  id         String   @id @default(uuid())
  identifier String   // email or phone
  tokenHash  String   @unique // SHA-256 hash of single-use token
  type       String   // EMAIL_VERIFICATION, PASSWORD_RESET, OTP_LOGIN
  expiresAt  DateTime
  attempts   Int      @default(0)
  createdAt  DateTime @default(now())

  @@index([identifier, type])
}

model StaffInvite {
  id          String     @id @default(uuid())
  email       String     @unique
  role        Role       // SUPPORT, MANAGER, OWNER
  tokenHash   String     @unique
  invitedById String
  invitedBy   User       @relation("InvitedByStaff", fields: [invitedById], references: [id])
  expiresAt   DateTime
  acceptedAt  DateTime?
  createdAt   DateTime   @default(now())

  @@index([email])
  @@index([tokenHash])
}

model TwoFactorSecret {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  secretKey   String   // Encrypted TOTP secret
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BackupCode {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  codeHash  String   // Argon2id or SHA-256 hash
  used      Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId, used])
}

// =========================================================================
// 2. APPEND-ONLY AUDIT LOG
// =========================================================================

model AuditLog {
  id          String   @id @default(uuid())
  actorId     String?
  actor       User?    @relation("ActorAuditLogs", fields: [actorId], references: [id], onDelete: SetNull)
  actorEmail  String
  actorRole   Role
  action      String   // LOGIN, LOGOUT, ROLE_CHANGE, REFUND_ISSUED, SETTING_UPDATE, etc.
  resource    String   // User, Order, Product, Coupon, System
  resourceId  String?
  diffJson    Json?    // Structured before/after diff
  ipAddress   String
  userAgent   String
  status      String   @default("SUCCESS") // SUCCESS, FAILURE, BLOCKED
  timestamp   DateTime @default(now())

  // Note: No update or delete relations. DB triggers prevent modifications.
  @@index([actorId])
  @@index([resource, resourceId])
  @@index([timestamp(sort: Desc)])
}

// =========================================================================
// 3. STORE, PRODUCTS, CONCURRENCY & PRICING
// =========================================================================

model Category {
  id           String    @id @default(uuid())
  name         String
  slug         String    @unique
  description  String?
  image        String?
  displayOrder Int       @default(0)
  active       Boolean   @default(true)
  version      Int       @default(1)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  products     Product[]

  @@index([slug])
}

model Product {
  id                 String           @id @default(uuid())
  name               String
  slug               String           @unique
  sku                String?          @unique
  shortDescription   String?
  fullDescription    String?
  regularPrice       Decimal          @db.Decimal(10, 2)
  salePrice          Decimal?         @db.Decimal(10, 2)
  costPrice          Decimal?         @db.Decimal(10, 2)
  stockQuantity      Int              @default(100)
  lowStockThreshold  Int              @default(10)
  trackInventory     Boolean          @default(true)
  isFeatured         Boolean          @default(false)
  isBestSeller       Boolean          @default(false)
  active             Boolean          @default(true)
  version            Int              @default(1) // Optimistic lock
  rating             Decimal          @default(4.9) @db.Decimal(3, 2)
  reviewCount        Int              @default(0)
  categoryId         String?
  category           Category?        @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  images             ProductImage[]
  variants           ProductVariant[]
  reviews            Review[]
  orderItems         OrderItem[]
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  @@index([slug])
  @@index([categoryId, active])
}

model ProductVariant {
  id            String   @id @default(uuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  title         String   // e.g., "100ml Bottle", "200ml Family Pack"
  sku           String   @unique
  price         Decimal  @db.Decimal(10, 2)
  stockQuantity Int      @default(50)
  version       Int      @default(1)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([productId])
}

model ProductImage {
  id           String   @id @default(uuid())
  productId    String
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url          String
  alt          String?
  displayOrder Int      @default(0)
  createdAt    DateTime @default(now())

  @@index([productId])
}

// =========================================================================
// 4. ORDERS, PAYMENTS, ADDRESSES & REFUNDS
// =========================================================================

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model Address {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  phone        String
  addressLine1 String
  addressLine2 String?
  city         String
  state        String
  pinCode      String
  country      String   @default("India")
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
}

model Order {
  id              String         @id @default(uuid())
  orderNumber     String         @unique
  userId          String?        // Nullable for guest checkout
  user            User?          @relation(fields: [userId], references: [id], onDelete: SetNull)
  guestEmail      String?
  guestPhone      String?
  guestAccessToken String?       // Signed HMAC token for guest order status link
  orderStatus     OrderStatus    @default(PENDING)
  paymentStatus   PaymentStatus  @default(PENDING)
  paymentMethod   String         // PREPAID_RAZORPAY, COD
  subtotal        Decimal        @db.Decimal(10, 2)
  discount        Decimal        @default(0) @db.Decimal(10, 2)
  shippingFee     Decimal        @default(0) @db.Decimal(10, 2)
  total           Decimal        @db.Decimal(10, 2)
  shippingAddress Json           // Immutable snapshot of address
  notes           String?
  version         Int            @default(1)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  items           OrderItem[]
  refunds         RefundRequest[]
  shipmentEvents  ShipmentEvent[]

  @@index([userId])
  @@index([orderNumber])
  @@index([createdAt(sort: Desc)])
}

model OrderItem {
  id           String   @id @default(uuid())
  orderId      String
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId    String?
  product      Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  productName  String
  productImage String?
  unitPrice    Decimal  @db.Decimal(10, 2)
  quantity     Int
  total        Decimal  @db.Decimal(10, 2)

  @@index([orderId])
}

model RefundRequest {
  id           String   @id @default(uuid())
  orderId      String
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  amount       Decimal  @db.Decimal(10, 2)
  reason       String
  status       String   @default("PENDING") // PENDING, APPROVED, REJECTED, PROCESSED
  requestedBy  String   // Staff ID or customer ID
  approvedBy   String?  // OWNER ID required if > limit
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([orderId])
}

model ShipmentEvent {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status      String
  location    String?
  description String
  timestamp   DateTime @default(now())

  @@index([orderId])
}

// =========================================================================
// 5. MARKETING, REVIEWS, SITE SETTINGS & CACHE INVALIDATION
// =========================================================================

model Review {
  id           String   @id @default(uuid())
  productId    String
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId       String?
  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  authorName   String
  rating       Int      @default(5)
  title        String?
  comment      String
  isVerified   Boolean  @default(true)
  status       String   @default("PENDING") // PENDING, APPROVED, HIDDEN
  createdAt    DateTime @default(now())

  @@index([productId, status])
}

model Coupon {
  id             String    @id @default(uuid())
  code           String    @unique
  discountType   String    // PERCENTAGE, FIXED
  discountValue  Decimal   @db.Decimal(10, 2)
  minOrderValue  Decimal?  @db.Decimal(10, 2)
  maxDiscount    Decimal?  @db.Decimal(10, 2)
  maxUses        Int?
  usedCount      Int       @default(0)
  active         Boolean   @default(true)
  startsAt       DateTime?
  expiresAt      DateTime?
  version        Int       @default(1)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([code])
}

model SiteSetting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}

model HomepageSection {
  id           String    @id @default(uuid())
  sectionType  String
  title        String?
  subtitle     String?
  contentJson  String
  displayOrder Int       @default(0)
  active       Boolean   @default(true)
  offerEndsAt  DateTime? // Strict time limit for promotional timers
  updatedAt    DateTime  @updatedAt
}
```

---

## 4. Comprehensive Permission Matrix (Typed Map)

### 4.1 Role Hierarchy & Rules
1. **CUSTOMER**:
   - Strictly forbidden from all `/admin` routes, admin server actions, and admin API endpoints.
   - Any attempt to invoke admin endpoints returns `403 Forbidden` and is flagged for rate-limit penalty.
2. **SUPPORT**:
   - Operational helper role.
   - Can read catalog, inventory, and orders.
   - Can update order status **only up to `SHIPPED`** (cannot mark as `DELIVERED`, `CANCELLED`, or `REFUNDED`).
   - Can add internal order notes.
   - **No revenue metrics** (only order counts visible in dashboard).
   - **PII is masked** in customer listings (e.g. `jo***@example.com`, `+91 98****1234`).
   - Moderates reviews (`APPROVE`, `HIDE`), cannot delete.
3. **MANAGER**:
   - Day-to-day operations leader.
   - Full CRUD on catalog, variants, pricing, inventory, coupons, and content.
   - Full order updates.
   - Can issue refunds **up to a configurable ceiling** (default: ₹5,000). Refunds above this threshold are stored in `PENDING` state and require `OWNER` authorization.
   - Can read audit logs **only for their own team actions**.
   - **Cannot access**: Team management (inviting, changing roles, deactivating), Site settings, or Manual cache purge.
   - **Cannot modify or demote an OWNER**.
4. **OWNER**:
   - Full administrative control.
   - Only role that can invite staff, assign roles, change settings, approve high-value refunds, or execute manual cache purges.
   - Protected by DB-level transaction: **the last remaining OWNER cannot be deleted, deactivated, or demoted**.
   - Mandatory re-authentication (sudo mode) for sensitive mutations.

### 4.2 Formal Permission Matrix Table

| Resource Area | Action | OWNER | MANAGER | SUPPORT | CUSTOMER | Guard & Condition Rules |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Analytics / Dashboard** | Read Order Counts | Yes | Yes | Yes | No | Support view excludes revenue |
| | Read Revenue / Financials | Yes | Yes | **No** | No | Restricted to OWNER and MANAGER |
| **Products & Categories** | Read Catalog | Yes | Yes | Yes | Public | Public data read through cache |
| | Create / Update / Delete | Yes | Yes | **No** | No | Invalidate `products` cache tag |
| **Pricing & Discount Tiers** | Read Pricing | Yes | Yes | Yes | Public | Public read cached; checkout live |
| | Mutate Regular / Sale Price| Yes | Yes | **No** | No | Requires version check & tag purge |
| **Inventory / Stock** | Read Stock Count | Yes | Yes | Yes | No | Product badge is cached; checkout live |
| | Adjust Stock Level | Yes | Yes | **No** | No | Concurrency checked on variant |
| **Coupons** | Read / Validate | Yes | Yes | Yes | Conditional | Public validates code; admin reads list |
| | Create / Edit / Deactivate | Yes | Yes | **No** | No | Audit logged on mutation |
| **Orders** | Read Order List / Detail | Yes | Yes | Yes | Own Only | Customer queries scoped to `session.userId` |
| | Update Status to Shipped | Yes | Yes | Yes | No | Support permitted up to `SHIPPED` |
| | Update Status Delivered/Cancel | Yes | Yes | **No** | No | Support forbidden |
| | Add Internal Notes | Yes | Yes | Yes | No | Appends to order notes timeline |
| **Refunds & Cancellations** | Refund $\le$ Threshold (₹5,000)| Yes | Yes | **No** | No | Direct execution via payment gateway |
| | Refund > Threshold (₹5,000)| Yes | Needs Approval | **No** | No | Stored as PENDING awaiting OWNER |
| **Customers** | Read Customer List | Full | Masked PII | Masked PII | No | DPDP compliance: support/manager masked |
| | Export Customer Data | Yes | **No** | **No** | No | OWNER only; requires re-auth; audit logged |
| **Reviews Moderation** | Approve / Hide Review | Yes | Yes | Yes | No | Triggers `reviews:{productId}` tag purge |
| | Delete Review | Yes | Yes | **No** | No | Support cannot delete |
| **Content (FAQs, Banners)** | CRUD Content | Yes | Yes | **No** | No | Invalidates `content` & `settings` tags |
| **Payment & Site Settings** | Read Settings | Yes | Read-only | Read-only | Public | Public reads cached subset |
| | Update Settings | Yes | **No** | **No** | No | OWNER only; requires re-auth |
| **Team Management** | Invite / Change Role / Deactivate | Yes | **No** | **No** | No | OWNER only; last OWNER protected |
| **Audit Logs** | Read Audit Logs | Full | Team Only | **No** | No | Append-only; zero mutation |
| **Manual Cache Purge** | Invalidate Tag Group | Yes | **No** | **No** | No | OWNER only; rate-limited; audit logged |
| **Profile, Password, 2FA** | Manage Own Profile | Yes | Yes | Yes | Yes | Self-service credentials & TOTP |

### 4.3 Typed Permission Map Definition (TypeScript)

```typescript
// src/lib/permissions/types.ts
export type Resource =
  | 'dashboard'
  | 'products'
  | 'pricing'
  | 'inventory'
  | 'coupons'
  | 'orders'
  | 'refunds'
  | 'customers'
  | 'reviews'
  | 'content'
  | 'settings'
  | 'team'
  | 'audit_logs'
  | 'cache';

export type Action =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'refund'
  | 'export'
  | 'moderate'
  | 'manage';

export const PERMISSION_MATRIX: Record<
  Resource,
  Partial<Record<Action, ('OWNER' | 'MANAGER' | 'SUPPORT')[]>>
> = {
  dashboard: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
  },
  products: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    create: ['OWNER', 'MANAGER'],
    update: ['OWNER', 'MANAGER'],
    delete: ['OWNER', 'MANAGER'],
  },
  pricing: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    update: ['OWNER', 'MANAGER'],
  },
  inventory: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    update: ['OWNER', 'MANAGER'],
  },
  coupons: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    create: ['OWNER', 'MANAGER'],
    update: ['OWNER', 'MANAGER'],
    delete: ['OWNER', 'MANAGER'],
  },
  orders: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    update: ['OWNER', 'MANAGER', 'SUPPORT'], // Conditional checks in DAL for status
  },
  refunds: {
    read: ['OWNER', 'MANAGER'],
    create: ['OWNER', 'MANAGER'], // Conditional amount check
    update: ['OWNER'], // Approvals above limit
  },
  customers: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    export: ['OWNER'],
  },
  reviews: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    moderate: ['OWNER', 'MANAGER', 'SUPPORT'],
    delete: ['OWNER', 'MANAGER'],
  },
  content: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    create: ['OWNER', 'MANAGER'],
    update: ['OWNER', 'MANAGER'],
    delete: ['OWNER', 'MANAGER'],
  },
  settings: {
    read: ['OWNER', 'MANAGER', 'SUPPORT'],
    update: ['OWNER'],
  },
  team: {
    read: ['OWNER'],
    manage: ['OWNER'],
  },
  audit_logs: {
    read: ['OWNER', 'MANAGER'], // Filtered by team for manager
  },
  cache: {
    manage: ['OWNER'],
  },
};
```

---

## 5. Defense-in-Depth Enforcement Architecture

A mistake in one layer is caught and rejected by the layer below it:

```
[Layer 1: Edge Proxy & Middleware]
  └── Redirects unauthenticated /admin traffic, sets security headers (noindex, no-store).
  └── NEVER treated as the security boundary.

[Layer 2: Server Actions & Route Handlers Wrapper (next-safe-action)]
  └── Enforces: Rate Limiting -> Session Resolution -> Permission Check -> Zod Schema.

[Layer 3: Data Access Layer (DAL) with 'server-only']
  └── Every read/write explicitly calls requirePermission(resource, action).
  └── Customer queries force `where: { userId: session.userId }` (prevents IDOR).
  └── Direct Prisma access from components or raw routes is strictly forbidden.

[Layer 4: UI Presentation Layer]
  └── Conditionally hides unusable buttons and navigation links (convenience only).

[Layer 5: Database Schema Constraints & Transactions]
  └── Foreign keys, unique indexes, optimistic concurrency checks (`version`), and
      CHECK constraints reject invalid state transitions even if application code fails.
```

---

## 6. Caching Architecture & TTL Allowlist

### 6.1 Multi-Layer Caching Design
1. **Edge/CDN Layer (Cloudflare)**:
   - Caches immutable assets (`/_next/static/*`, media images) with `Cache-Control: public, max-age=31536000, immutable`.
   - Anonymous storefront HTML cached with `s-maxage=300, stale-while-revalidate=600`.
   - **Bypass rules**: Strictly bypass CDN cache for any request with a session cookie, and for `/admin/*`, `/account/*`, `/cart/*`, `/checkout/*`, `/api/*`.
2. **Next.js Server Cache (Cache Components / Tagged Cache)**:
   - Uses Next.js 16 cache primitives (`"use cache"`, `cacheTag()`, `cacheLife()`) or `unstable_cache` with tagged invalidations.
   - Scoped strictly to public catalog, content, approved reviews, and banner settings.
3. **Upstash Redis**:
   - Stores rate-limiting sliding windows.
   - Holds short-lived aggregates (e.g. admin analytics counts, 60s TTL).
   - Single-flight stampede protection lock (`SET lock:{tag} true NX EX 10`).
4. **Database**:
   - Connection pool via PostgreSQL. Money-critical calculations (checkout pricing, coupons, stock deductions) **always** hit the live database.

### 6.2 The Cache Allowlist & Staleness Matrix

| Data Type | Max Staleness | Storage Layer | Invalidation Trigger & Tags | Fallback on Invalidation Failure |
| :--- | :---: | :--- | :--- | :--- |
| **Public Catalog & Categories** | 1 Hour | Edge + Next.js Cache | Admin product/category edit $\rightarrow$ `revalidateTag("products")`, `revalidateTag("category:{id}")` | TTL expires in 1h; logged to audit |
| **Approved Reviews & Ratings** | 10 Min | Next.js Server Cache | Review approved/hidden $\rightarrow$ `revalidateTag("reviews:{productId}")` | TTL expires in 10 min |
| **Site Settings & Banners** | 5 Min | Next.js Server Cache | Admin settings update $\rightarrow$ `revalidateTag("settings")` | TTL expires in 5 min |
| **Stock Status Badge** (Catalog Display) | 60 Sec | Next.js Server Cache | Tag `stock:{productId}`. *Display only*. | **Checkout always verifies live DB inventory** |
| **Admin Analytics Aggregates** | 60 Sec | Upstash Redis | Key `cache:admin:dashboard:{scope}`. Stored with 60s TTL. | Live DB query if cache miss or Redis down |

### 6.3 What Must NEVER Be Cached (Strict Deny-List)
- ❌ **Cart items and totals**
- ❌ **Checkout final prices, taxes, and shipping rates**
- ❌ **Live inventory locks at payment**
- ❌ **Coupon codes validation and usage limits**
- ❌ **Payment state, transactions, and order receipts**
- ❌ **Customer accounts, profiles, addresses, and tracking data**
- ❌ **Admin panel data, audit logs, and customer listings**
- ❌ **User session states, roles, and permissions**

*All private responses explicitly set:* `Cache-Control: private, no-cache, no-store, must-revalidate`.

### 6.4 Cache Security & Defense Rules
- **Cache-Key Sanitization**: Every cache tag and key is validated with Zod. Raw query parameters from users are stripped; only allowlisted params (`page`, `sort`, `category`) are hashed into keys to eliminate **Cache-Busting DoS**.
- **Poisoning Prevention**: Unkeyed HTTP headers (`Host`, `X-Forwarded-Host`) are ignored. All canonical URLs use `process.env.NEXT_PUBLIC_APP_URL`.
- **Web Cache Deception Prevention**: Specific origin headers ensure `.css`, `.js`, and `.ico` extensions requested under `/account/*` or `/admin/*` are served with `Cache-Control: private, no-store`.
- **Fail-Closed vs Fail-Open on Redis Outage**:
  - Auth, OTP, Login, and Checkout rate limiting: **FAILS CLOSED** (or falls back to a strict in-process rate limiter).
  - Public storefront catalog cache: **FAILS OPEN** (falls back directly to PostgreSQL queries).

---

## 7. Customer Authentication & Account Area (/account)

1. **Authentication Channels**:
   - **Email + Password**: Minimum 10 characters, entropy verified via `zxcvbn-ts`, checked against breached password list.
   - **Phone / Email OTP**: 6-digit numeric OTP with 10-minute expiry, max 3 verification attempts per token, 60-second resend cooldown.
2. **Password Reset Flow**:
   - Single-use, short-lived (15 min) cryptographic token. Token stored as SHA-256 hash in DB.
   - Generic response on submission ("If an account exists, a link has been sent") to prevent account enumeration.
   - Resetting password **immediately revokes all active sessions** across all devices.
3. **Session Management**:
   - Session tokens delivered in `httpOnly`, `Secure`, `SameSite=Lax` cookies.
   - Session rotated upon login and privilege elevation.
   - Customer account security view shows all active sessions with user agent, IP, and "Log Out All Devices" action.
4. **IDOR Defense in Data Access Layer (DAL)**:
   - The client never passes `userId`.
   - The DAL extracts `userId` from the verified session server-side.
   - Every customer query enforces:
     ```typescript
     // src/data/user/orders.ts
     export async function getCustomerOrders() {
       const session = await requireCustomerSession();
       return prisma.order.findMany({
         where: { userId: session.user.id }, // IDOR impossible
         orderBy: { createdAt: 'desc' }
       });
     }
     ```
5. **Guest Checkout Tracking**:
   - Guest orders are decoupled from accounts. Access is granted only via a signed HMAC link (`/track-order?token=...`) with short expiry, or by matching order number + verified phone.
6. **DPDP Act (India) Compliance**:
   - "Download My Data" action exports all personal data, orders, and addresses as JSON.
   - "Delete My Account" flow removes PII, anonymizes historical orders for tax/audit compliance (`guestEmail = 'anonymized@deleted'`).
   - Minimal PII in application logs; phone numbers and emails masked.

---

## 8. Admin Panel Security & Administration

1. **Route Group Architecture**:
   - Admin files reside under `src/app/(admin)/admin/...`.
   - Isolated layout without storefront shell, header, or footer.
   - Emits `X-Robots-Tag: noindex, nofollow` on all responses.
2. **First OWNER Initialization**:
   - Zero public admin signup.
   - Initial OWNER created via a one-time secure seed CLI command reading `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` from `.env`.
3. **Staff Invitation Workflow**:
   - OWNER invites staff by providing their email and fixed role (`SUPPORT` or `MANAGER`).
   - Generates a signed, expiring invite link with a one-time token.
   - Recipient completes onboarding, sets their password, and is **forced to enroll in TOTP 2FA** before accessing the dashboard.
4. **Mandatory TOTP 2FA & Sudo Mode**:
   - Mandatory for all admin roles (`OWNER`, `MANAGER`, `SUPPORT`).
   - Generates 10 hashed single-use backup codes.
   - **Sudo Mode / Re-Authentication**: Sensitive actions (changing roles, issuing refunds > threshold, editing site settings, purging cache) require entering the admin password or 2FA code within the last 15 minutes.
5. **Privilege-Escalation & Last-Owner Protections**:
   - Admin users cannot alter their own role.
   - MANAGER cannot create or promote anyone to OWNER.
   - **Last OWNER Guarantee**: A database transaction verifies that if a user is the last active OWNER, any demotion, deactivation, or deletion request is rejected with a fatal error.
   - Deactivating a user immediately purges all their active sessions from the database.
6. **Append-Only Audit Logging**:
   - Logged events: logins, failed attempts, role changes, price edits, coupon updates, refunds, exports, setting updates, cache purges.
   - Records: `actorId`, `actorRole`, `action`, `resource`, `resourceId`, `diffJson`, `ipAddress`, `userAgent`, `timestamp`.
   - Database security rule prevents `UPDATE` or `DELETE` on the `AuditLog` table.
7. **Optimistic Concurrency Control**:
   - `Product`, `ProductVariant`, and `Coupon` include a `version: Int` field.
   - Admin updates require matching `version`. If another staff member updated the product in the interim, the transaction aborts with a concurrency conflict warning.

---

## 9. File & Directory Layout

```
herbicCure-main/
├── prisma/
│   ├── schema.prisma              # PostgreSQL schema with Better Auth + Audit + Versioning
│   ├── seed.ts                    # Catalog seed & one-time OWNER CLI bootstrap
│   └── migrations/                # Postgres migration history
├── src/
│   ├── app/
│   │   ├── (admin)/               # ISOLATED ADMIN ROUTE GROUP
│   │   │   └── admin/
│   │   │       ├── layout.tsx     # Admin shell, security headers, theme, noindex
│   │   │       ├── login/         # Admin login with TOTP challenge
│   │   │       ├── dashboard/     # Role-filtered analytics
│   │   │       ├── products/      # Products & variants CRUD with TanStack Table
│   │   │       ├── categories/    # Category management
│   │   │       ├── orders/        # Orders, status progression, notes
│   │   │       ├── refunds/       # Threshold-controlled refund approvals
│   │   │       ├── coupons/       # Discount codes & redemption limits
│   │   │       ├── customers/     # Customer list with PII masking & DPDP exports
│   │   │       ├── reviews/       # Moderation queue
│   │   │       ├── team/          # OWNER-only staff invites & role assignment
│   │   │       ├── audit-logs/    # Append-only activity viewer
│   │   │       ├── settings/      # OWNER-only store settings & logo branding
│   │   │       └── profile/       # Password, TOTP setup, active sessions
│   │   ├── (storefront)/          # Public storefront & Customer portal
│   │   │   ├── account/           # Customer account, orders, addresses, sessions
│   │   │   ├── cart/              # Live recalculated bag
│   │   │   ├── checkout/          # Live price & inventory checkout
│   │   │   ├── track-order/       # Guest tracking with signed HMAC token
│   │   │   └── ...                # Catalog, products, collections
│   │   └── api/
│   │       ├── auth/              # Better Auth route handlers (...[all]/route.ts)
│   │       ├── webhooks/          # Razorpay / delivery webhooks (live DB update + tag invalidation)
│   │       └── ...
│   ├── data/                      # STRICT DATA ACCESS LAYER (DAL)
│   │   ├── public/                # ONLY PLACE ALLOWED TO USE CACHING DIRECTIVES
│   │   │   ├── catalog.ts         # Cached products, variants, categories
│   │   │   ├── content.ts         # Cached FAQs, transforms, banners
│   │   │   └── reviews.ts         # Cached approved reviews & ratings
│   │   ├── user/                  # SERVER-ONLY CUSTOMER DAL (NEVER CACHED, IDOR PROTECTED)
│   │   │   ├── orders.ts          # Scoped to session.userId
│   │   │   ├── addresses.ts       # Scoped to session.userId
│   │   │   └── profile.ts         # Customer export & deletion flows
│   │   └── admin/                 # SERVER-ONLY ADMIN DAL (NEVER CACHED, PERMISSION ENFORCED)
│   │       ├── analytics.ts       # Role-scoped queries (Support sees no revenue)
│   │       ├── products.ts        # Concurrency-checked catalog mutations
│   │       ├── orders.ts          # Status progression & notes
│   │       ├── refunds.ts         # Threshold verification & approval
│   │       ├── team.ts            # Invites & last-owner protection
│   │       └── audit.ts           # Append-only audit writer
│   ├── lib/
│   │   ├── auth/                  # Better Auth configuration, plugins, session utils
│   │   │   ├── auth.ts            # Better Auth client & server config
│   │   │   ├── session.ts         # Session extraction & sudo-mode validation
│   │   │   └── tokens.ts          # Cryptographic hashing & signed guest tokens
│   │   ├── permissions/           # RBAC PERMISSIONS ENGINE
│   │   │   ├── types.ts           # Permission matrix types & definitions
│   │   │   └── guard.ts           # requirePermission(resource, action)
│   │   ├── safe-action/           # next-safe-action CLIENTS
│   │   │   ├── action-client.ts   # Base client with logging & rate-limit
│   │   │   ├── user-action.ts     # Requires customer session
│   │   │   └── admin-action.ts    # Requires admin session + role permission
│   │   ├── cache/                 # CACHING & TAG INVALIDATION
│   │   │   ├── tags.ts            # Tag taxonomy constants & builders
│   │   │   ├── invalidator.ts     # Revalidation helpers & audit logger
│   │   │   └── lock.ts            # Redis single-flight mutex lock
│   │   ├── rate-limit/            # UPSTASH DISTRIBUTED RATE LIMITERS
│   │   │   ├── limiters.ts        # Login, OTP, Reset, Public limiters
│   │   │   └── redis.ts           # Redis client with in-memory fallback
│   │   └── audit/
│   │       └── logger.ts          # Structured audit event writer
│   └── components/
│       ├── admin/                 # Admin UI components, TanStack tables, filters
│       └── ui/                    # shadcn/ui components
└── tests/
    ├── unit/
    │   ├── permissions.test.ts    # Matrix test: All Role x Resource x Action permutations
    │   └── cache-tags.test.ts     # Cache tag formatting & sanitize tests
    ├── integration/
    │   ├── idor.test.ts           # Customer A cannot access Customer B's orders
    │   ├── privilege-escalation.test.ts # Manager cannot promote; last Owner immutable
    │   └── optimistic-lock.test.ts# Concurrent updates trigger version conflict
    └── e2e/
        ├── admin-auth.spec.ts     # 2FA challenge, sudo mode, session revocation
        └── cache-invalidation.spec.ts # Price edit reflects on catalog within max staleness
```

---

## 10. Phased Implementation Roadmap

1. **Phase 1: PostgreSQL Migration, Core Prisma Schema & Better Auth Foundation**
   - Migrate Prisma from SQLite to PostgreSQL with Enums, Optimistic Locks, and Cascades.
   - Install and configure Better Auth with Prisma adapter, Argon2id, and 2FA plugins.
   - Create one-time CLI seed script to initialize the first OWNER.
2. **Phase 2: Customer Authentication, Sessions & Secure Account Area**
   - Implement customer signup, login, OTP channels, and password reset with generic responses.
   - Build `/account` dashboard (orders, addresses, sessions, data export/deletion).
   - Implement zero-trust DAL with session-scoped queries to permanently eradicate IDOR.
3. **Phase 3: Permission Matrix, Data-Access Layer & `next-safe-action` Pipeline**
   - Build typed RBAC permission map (`src/lib/permissions`).
   - Implement `adminAction` wrapper enforcing `RateLimit -> Session -> Permission -> Zod Validation`.
   - Build DAL modules (`src/data/admin/*`) guarded by `server-only`.
4. **Phase 4: Public Caching Layer, Tag Invalidation & Cloudflare Rules**
   - Isolate public reads into `src/data/public/*` with tagged caching.
   - Implement Redis single-flight stampede locks and tag invalidation hooks.
   - Configure Cloudflare bypass headers and rules for private routes.
5. **Phase 5: Admin Route Group Shell, Staff Invites & Audit Logging**
   - Move admin to `src/app/(admin)/admin/...` with isolated security layout and `noindex`.
   - Build OWNER staff invitation system with expiring tokens.
   - Implement append-only audit logging and the last-OWNER database protection.
6. **Phase 6: Admin Feature Modules with TanStack Table**
   - Implement Dashboard (role-scoped metrics), Products, Orders (status limits), Refunds (₹5,000 threshold), Coupons, and Settings.
7. **Phase 7: Testing, Red-Teaming & Hardening**
   - Execute automated permission matrix test suite.
   - Validate IDOR, role tampering, concurrent mutations, and cache leak regressions.
   - Generate `docs/ADMIN_GUIDE.md` and `docs/CACHING.md`.

---

## 11. Definition of Done Checklist

- [ ] Every admin DAL function and mutation strictly enforces role permissions server-side.
- [ ] Automated role matrix tests pass for all combinations across OWNER, MANAGER, SUPPORT, CUSTOMER, and unauthenticated users.
- [ ] Privilege escalation is impossible: the last OWNER cannot be removed or demoted; self-promotion is blocked.
- [ ] 2FA is enforced for all admin accounts; sensitive actions require re-authentication (sudo mode).
- [ ] All admin operations are written to an append-only audit log.
- [ ] Only explicitly allowlisted public data is cached; customer data and money-critical flows are never cached.
- [ ] Customer account area strictly scopes all queries to `session.userId`, completely eliminating IDOR.
- [ ] Dependencies are pinned and verified against current documentation.
