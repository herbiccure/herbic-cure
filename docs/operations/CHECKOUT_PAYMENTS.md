# Checkout & Payments Architecture

## 1. Overview
Herbic Cure supports two primary customer payment methods:
1. **Prepaid**: 100% upfront online payment via Razorpay (UPI, GPay, PhonePe, Cards, NetBanking). All prepaid orders receive **100% Free Pan-India Delivery** (₹0 delivery charge).
2. **Cash on Delivery (COD)**: Delivered via Delhivery Express. Subject to standard courier fee (₹89) if subtotal is below ₹499, and free above ₹499.

To combat fake and fraudulent COD orders, the store includes a configurable **COD Advance Payment** feature.

---

## 2. COD Advance Payment Mechanism

### How it Works
When enabled by the store owner (`cod_advance_enabled === 'true'`):
1. **Checkout Selection**: When a customer selects Cash on Delivery, the checkout UI informs them that an advance payment is required to confirm the order.
2. **Online Advance**: The customer clicks *"Pay ₹[Advance] Advance & Confirm Order"* which opens the Razorpay gateway modal for the advance amount only.
3. **Verification**:
   - Razorpay cryptographically signs the payment (`razorpay_signature`).
   - The server verifies HMAC SHA256 against `RAZORPAY_KEY_SECRET`.
   - The order's `orderStatus` moves from `PENDING` to `CONFIRMED`.
   - The `paymentStatus` becomes `PARTIALLY_PAID` (or `PAID` if advance was 100%).
   - The `paymentMethod` remains `COD` to reflect delivery logistics.
   - `advancePaymentId` and `advancePaidAt` are permanently stored.
4. **Delhivery Manifestation**:
   - When the store admin accepts the order and generates the Delhivery AWB, `cod_amount` is automatically set to `codBalanceAmount = order.total - order.advanceAmount`.
   - Delhivery courier collects only the remaining balance at the customer's doorstep.
   - If advance covered 100% of the invoice, the shipment mode automatically switches to `Prepaid` and `cod_amount = '0'`.

---

## 3. Calculation Rules
- **Fixed Mode**: `advance = Math.min(fixedValue, total)`. Fixed values must be whole rupees (integer).
- **Percentage Mode**: `advance = Math.round((total * percentValue) / 100)`.
- **Max Cap**: If configured, `advance = Math.min(advance, maxCap)`.
- **Minimum Floor**: Razorpay minimum payment is 100 paise = ₹1.00. Advance is always floored at ₹1.
- **Full Advance Case**: If `advance >= total`, balance is ₹0 and shipment manifests as Prepaid.

---

## 4. Security & Anti-Tampering
- **Zero Client Trust**: All amounts (`subtotal`, `discount`, `shippingFee`, `advanceAmount`, `codBalanceAmount`) are calculated authoritatively on the server inside `/api/orders/create` using database products, coupons, and site settings.
- **Audit Snapshot**: Every order stores an immutable JSON snapshot (`advanceSettingsSnapshot`) preserving the settings in effect at the exact moment of order placement.
- **RBAC Guard**: Settings can only be modified by authenticated users with role `OWNER` or `SUPER_ADMIN`. Any modification is recorded in `AuditLog`.
