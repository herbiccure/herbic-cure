# COD Advance Payment Feature Plan
*Herbic Cure Ayurvedic E-Commerce Platform*

---

## 1. Executive Summary & Objective

To eliminate fake, bot-generated, and fraudulent Cash on Delivery (COD) orders while preserving customer conversion, we are introducing a **COD Advance Payment** engine.

When enabled by store administrators:
1. Customers choosing Cash on Delivery pay a small token advance online (via our existing Razorpay integration) to confirm their order intent.
2. The remaining balance is collected in cash by **Delhivery Logistics** upon physical delivery.
3. If payment of the advance fails or is abandoned, the order is **never confirmed**, **no Delhivery shipment is manifested**, and **zero courier fees** are incurred.
4. When disabled, the entire feature is completely invisible to customers, and normal full COD functions as before.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ STORE ADMIN SETTINGS (/admin/settings)                                │
│ [OWNER / SUPER_ADMIN Only]                                             │
│  - Toggle: "Require advance payment for COD orders" (Default: OFF)     │
│  - Type: FIXED (₹) or PERCENTAGE (%)                                  │
│  - Value: e.g. ₹99 or 15%                                             │
│  - Max Cap: e.g. ₹200 (optional for percentage)                       │
│  - Customer Message: e.g. "Pay a small advance online to confirm..."   │
│  - Zod Validated + Audit Logged + Invalidate Public Cache             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ CUSTOMER CHECKOUT (/checkout)                                          │
│  - Reads settings via /api/navigation                                  │
│  - When COD selected & Feature ON:                                     │
│      Order Total:       ₹699                                           │
│      Pay Now (Advance): ₹99                                            │
│      Pay on Delivery:   ₹600                                           │
│  - Customer clicks "Pay Advance & Place Order"                         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ SERVER ORDER CREATION (/api/orders/create)                             │
│  - Authoritative re-calculation of advance from database settings     │
│  - Ignores any client-submitted advance amounts or toggles             │
│  - Order created with orderStatus = 'PENDING'                          │
│  - Snapshots advance settings inside Order record                     │
│  - Creates Razorpay Gateway Order for `advanceAmount` (in paise)       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PAYMENT VERIFICATION & WEBHOOK (/api/payment/razorpay/verify & webhook)│
│  - Cryptographic HMAC-SHA256 signature verification                   │
│  - Validates paid amount matches `advanceAmount * 100`                 │
│  - Sets orderStatus = 'CONFIRMED', paymentStatus = 'PARTIALLY_PAID'   │
│  - Records advancePaymentId & advancePaidAt                            │
│  - Order stays in "Pending AWB" (₹0 Delhivery charges)                 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ DELHIVERY SHIPMENT MANIFESTATION (/api/admin/orders/[id]/manifest)     │
│  - Payment Mode: 'COD' (or 'Prepaid' if balance = 0)                   │
│  - cod_amount = codBalanceAmount (Order Total - Advance Amount)        │
│  - total_amount = Order Total (Full declared invoice value)            │
│  - Delhivery label prints only the balance due                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema & Migration (Prisma)

### Schema Changes in `prisma/schema.prisma`:

```prisma
model Order {
  // Existing fields ...
  total                   Float
  paymentMethod           String          @default("COD") // COD or RAZORPAY
  paymentStatus           String          @default("PENDING") // PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED
  orderStatus             String          @default("CONFIRMED") // PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REFUNDED

  // NEW: COD Advance Payment fields
  advanceAmount           Float           @default(0)
  codBalanceAmount        Float?          @default(0)
  advancePaymentId        String?         // Razorpay Payment ID (e.g., pay_XXXXX)
  advancePaidAt           DateTime?
  advanceSettingsSnapshot String?         // JSON snapshot of { required: boolean, type: string, value: number, maxCap?: number }

  // Relations & metadata ...
}
```

### Settings in `SiteSetting` key-value table:
- `cod_advance_enabled`: `'true'` | `'false'` (Default: `'false'`)
- `cod_advance_type`: `'FIXED'` | `'PERCENTAGE'` (Default: `'FIXED'`)
- `cod_advance_value`: stringified number (e.g. `'99'` or `'15'`)
- `cod_advance_max_cap`: stringified number (e.g. `'200'`, optional)
- `cod_advance_message`: string (Default: `"Pay a small advance online to confirm your COD order. The rest is paid on delivery."`)

### Migration Execution Plan:
- Command: `npx prisma migrate dev --name add_cod_advance_fields`
- Zero downtime, backward-compatible defaults (`@default(0)`).

---

## 4. Admin Settings UI & Security (`/admin/settings`)

### Placement:
Inside the **"Shipping & Fulfillment"** card on `/admin/settings`, directly below the "Allow Cash on Delivery (COD) across India" checkbox.

### Controls:
1. **Toggle Switch**: "Require advance payment for COD orders" (Default: OFF).
2. **Dependent Options Container**:
   - Automatically **disabled and greyed out** if "Allow COD" is unchecked.
   - When Toggle is ON, reveals:
     - **Advance Type**: Segmented choice between **Fixed Amount (₹)** and **Percentage (%)**.
     - **Advance Value Input**: Numerical input (₹ value or % value).
     - **Maximum Cap Input** (conditional): Only visible when Percentage is chosen (e.g., "Max Cap ₹200").
     - **Customer-Facing Description**: Text area for checkout message with character count indicator.

### Security & RBAC:
- Restricted to **`OWNER`** and **`SUPER_ADMIN`** roles only (enforced in `hasPermission(role, 'SETTING', 'UPDATE')` and `requireAdminAuth`).
- Validation via Zod:
  - If fixed: value must be `>= 1` (Razorpay minimum ₹1.00 = 100 paise) and whole number.
  - If percentage: value must be between `1` and `100`.
  - Max cap: must be `> 0` if specified.
  - Negative values strictly rejected.
- Audit Log:
  - Calls `createAuditLogEntry` logging actor, action `'COD_ADVANCE_SETTINGS_UPDATED'`, resource `'SiteSetting'`, and full before/after diff.
- Cache Invalidation:
  - Calls `invalidateAllPublicCaches()` so `/api/navigation` and storefront update immediately.

---

## 5. Server-Side Calculation Logic & Anti-Tampering

All amounts are calculated strictly on the server in `src/app/api/orders/create/route.ts`. Any client-submitted `advanceAmount`, `codBalanceAmount`, or `codAdvanceEnabled` fields in the request body are **strictly discarded**.

### Server Calculation Algorithm:
```typescript
let calculatedAdvanceAmount = 0;
let calculatedCodBalance = calculatedFinalTotal;
let advanceSnapshot: Record<string, any> | null = null;

if (paymentMethod === 'COD' && codAdvanceEnabledSetting === 'true') {
  if (codAdvanceType === 'PERCENTAGE') {
    const rawAdvance = Math.round((calculatedFinalTotal * codAdvancePercent) / 100);
    calculatedAdvanceAmount = codAdvanceMaxCap
      ? Math.min(rawAdvance, codAdvanceMaxCap)
      : rawAdvance;
  } else {
    calculatedAdvanceAmount = Math.round(codAdvanceFixedAmount);
  }

  // Edge Case 1: Advance equals or exceeds order total -> Treat as full prepaid
  if (calculatedAdvanceAmount >= calculatedFinalTotal) {
    calculatedAdvanceAmount = calculatedFinalTotal;
    calculatedCodBalance = 0;
  } else {
    calculatedCodBalance = Math.max(0, calculatedFinalTotal - calculatedAdvanceAmount);
  }

  // Edge Case 2: Gateway Minimum Enforcement (Razorpay requires at least ₹1.00 = 100 paise)
  if (calculatedAdvanceAmount > 0 && calculatedAdvanceAmount < 1) {
    calculatedAdvanceAmount = 1;
    calculatedCodBalance = Math.max(0, calculatedFinalTotal - 1);
  }

  advanceSnapshot = {
    required: true,
    type: codAdvanceType,
    value: codAdvanceType === 'PERCENTAGE' ? codAdvancePercent : codAdvanceFixedAmount,
    maxCap: codAdvanceMaxCap || null,
    calculatedAdvance: calculatedAdvanceAmount,
    calculatedBalance: calculatedCodBalance,
  };
}
```

---

## 6. Checkout Experience (`/checkout`)

1. **Feature OFF**:
   - Standard checkout behavior remains 100% untouched.
   - COD radio says: "Cash on Delivery" with normal summary.
2. **Feature ON & COD Selected**:
   - Order summary renders an itemized breakdown **before** the customer clicks place order:
     - **Order Total**: `₹699`
     - **Pay Online Now (Advance)**: `₹99` (highlighted in rose brand accent)
     - **Pay on Delivery (Balance)**: `₹600` (highlighted in emerald accent)
   - Trust badge & explanation banner:
     - Displays custom merchant message from settings (e.g., *"Pay ₹99 now via UPI/Cards to confirm order. Pay remaining ₹600 in cash when Delhivery delivers."*).
   - Button reads: **"Pay ₹[Advance] Advance & Confirm Order"**.
   - Initiates Razorpay checkout for `calculatedAdvanceAmount`.
   - If payment modal is dismissed or fails, order stays `PENDING` (stock held with timeout, retry supported).

---

## 7. Webhook & Payment Verification

### Verification (`/api/payment/razorpay/verify` & `/webhook`):
- Verifies cryptographic signature using `verifyRazorpayPaymentSignature` / `verifyRazorpayWebhookSignature`.
- Validates paid amount in paise:
  - For full prepaid orders: `paidPaise >= total * 100`
  - For COD advance orders: `paidPaise >= advanceAmount * 100`
- Updates order:
  - `paymentStatus: 'PARTIALLY_PAID'` (or `'PAID'` if advance == total)
  - `orderStatus: 'CONFIRMED'`
  - `advancePaymentId: razorpay_payment_id`
  - `advancePaidAt: new Date()`
  - `paymentMethod: 'COD'` (preserved so delivery logic knows it is COD)
- Logs `ShipmentEvent`:
  - `status: 'PAYMENT_VERIFIED'`
  - `description: 'Advance payment of ₹99 confirmed via Razorpay (Payment ID: pay_XXXXX). Balance ₹600 to collect on delivery.'`

---

## 8. Delhivery Logistics Integration

In `src/app/api/admin/orders/[id]/manifest-delhivery/route.ts` & `src/lib/shipping/delhivery.ts`:
- If `order.paymentMethod === 'COD'`:
  - If `order.codBalanceAmount > 0`:
    - `payment_mode`: `'COD'`
    - `cod_amount`: `String(Math.round(order.codBalanceAmount))` (only the balance!).
    - `total_amount`: `String(Math.round(order.total))` (full invoice value).
    - `quantity`: strictly physical piece count.
  - If `order.codBalanceAmount === 0`:
    - `payment_mode`: `'Prepaid'`
    - `cod_amount`: `'0'`
    - `total_amount`: `String(Math.round(order.total))`
- Thermal shipping label printed by Delhivery collects **only the balance amount**.

---

## 9. Admin Orders Page & Advance Refunds (`/admin/orders`)

- In the order details drawer/modal:
  - Clearly displays:
    - **Total Invoice**: `₹699`
    - **Advance Paid Online**: `₹99` (Razorpay ID: `pay_XXXXX`)
    - **Balance Due on Delivery**: `₹600`
  - For unmanifested / cancelled orders:
    - **"Initiate Advance Refund"** button:
      - Uses existing `/api/admin/refunds` (`initiateRefundRequest`).
      - Pre-populates amount with `order.advanceAmount`.
      - Requires owner approval, validates amount, audit logged.

---

## 10. Decisions for the Store Owner

Before finalizing values, here are 3 operational decisions for the owner:

| # | Decision Item | Recommended Default | Options / Trade-offs |
|---|---------------|---------------------|----------------------|
| **1** | **Default Advance Value** | **Fixed ₹99** (or 15% capped at ₹200) | **Fixed (₹50 - ₹100)**: Simplest for customers to understand. Low friction, high filter for fake orders.<br>**Percentage (10% - 20%)**: Better for high-value orders (e.g. ₹2,000+ combos) to cover higher return courier risk. |
| **2** | **Refund Policy on Order Cancellation / RTO** | **Manual Review via Admin Refunds** | **Option A (Strict)**: If customer cancels before dispatch, refund advance. If customer refuses parcel at doorstep (RTO), advance is retained to cover Delhivery shipping costs.<br>**Option B (Lenient)**: Always refund advance upon cancellation via Admin Refunds tab. |
| **3** | **Default Customer-Facing Notice Copy** | *"Pay a small advance of ₹[Amount] online to confirm your order. The remaining balance of ₹[Balance] is paid in cash upon delivery."* | Clear, transparent wording builds trust and eliminates any confusion at the doorstep. |

---

## 11. Test Coverage Plan (Vitest)

We will add a dedicated test suite `tests/cod-advance.test.ts` covering:
1. **Calculation Engine**:
   - Fixed advance calculation (e.g. ₹99 on ₹699 order).
   - Percentage advance calculation (e.g. 15% on ₹1,000 = ₹150).
   - Percentage cap enforcement (e.g. 20% on ₹2,000 = ₹400 capped at ₹200).
   - Advance >= Total edge case (treated as prepaid).
   - Tiny total edge cases (< ₹1).
2. **Anti-Tampering**:
   - Verifies that client-sent `advanceAmount` or `codAdvanceEnabled` are discarded by server.
3. **Feature Toggle Disabled**:
   - Feature off returns standard COD, hides UI, rejects advance payment path.
4. **Webhook & Signature**:
   - Valid signature verifies advance payment.
   - Invalid signature rejected.
   - Amount mismatch (e.g. paid less than advance) rejected.
   - Idempotent duplicate event replay handled safely.
5. **Delhivery Payload**:
   - Verifies `cod_amount` equals balance, not total.
   - Verifies `total_amount` equals full invoice.
   - Verifies `payment_mode` switches to `Prepaid` if balance is 0.
6. **RBAC & Permissions**:
   - Non-owner roles (`STAFF`, `SUPPORT`, `MANAGER`) cannot modify COD advance settings.
   - Owner changes write to `AuditLog`.
7. **Order Snapshot**:
   - Modifying settings after order placement leaves existing order amounts untouched.
