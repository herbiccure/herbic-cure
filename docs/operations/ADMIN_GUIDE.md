# Herbic Cure Admin Console - Operator & Security Guide

## 1. Architecture & Role-Based Access Control (RBAC)
The Herbic Cure Administrative Console lives in the isolated route group `src/app/(admin)/admin` and enforces strict deny-by-default access control:

| Role | Catalog & Deals | Orders & Inventory | Refunds | Staff Management | Audit Trail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OWNER** | Full CRUD | Full Access | Full Approval | Invite & Revoke | Full View |
| **MANAGER** | Full CRUD | Read / Status Update | Request Only | Denied | Read View |
| **SUPPORT** | Read Only | Read / Update Notes | Read Only | Denied | Denied |
| **CUSTOMER**| Denied (403) | Denied (403) | Denied (403) | Denied (403) | Denied (403) |

## 2. Bootstrapping Initial OWNER
An initial OWNER account was provisioned via `scripts/seed-owner.ts`:
- **Email**: `owner@herbiccure.com`
- **Role**: `OWNER`
- **Password**: `HerbicCure@Owner#2026`
- **Hash Algorithm**: Argon2id (`m=65536, t=3, p=4`)

## 3. Last-OWNER Safety Protection
To prevent accidental administrative lockouts, `src/data/admin/staff.ts` enforces a database concurrency check before deleting or demoting any OWNER. If only 1 active OWNER exists on the platform, the operation is blocked with:
`OPERATION ABORTED: Cannot remove or demote the last remaining OWNER of the platform.`

## 4. Two-Tier Refund Authorization
1. Any staff member (`MANAGER`, `SUPPORT`, or `OWNER`) can initiate a refund request from `/admin/refunds`.
2. The request is placed in `PENDING` status.
3. Only an active `OWNER` can approve and finalize the refund payout.
4. Once approved, an atomic transaction updates the order status to `REFUNDED`, changes payment status to `REFUNDED`, and records an immutable entry in the audit trail.

## 5. Audit Logging
Every sensitive action (staff invitation, staff revocation, refund approval, login success, DPDP account anonymization, COD advance settings update) writes an immutable record to the `AuditLog` table capturing:
- Actor ID, Actor Email, and Role
- Resource & Resource ID
- Action Type
- Before/After Diff JSON
- IP Address & User Agent
- Timestamp (UTC)

## 6. COD Advance Payment Configuration & Operational Controls
To reduce fraudulent orders and fake deliveries, Herbic Cure supports collecting an online advance on Cash on Delivery orders:
1. **Access & Permissions**: Only `OWNER` or `SUPER_ADMIN` can toggle or configure COD Advance settings in `/admin/settings` under **Shipping & Fulfillment**.
2. **Configuration Options**:
   - **Require advance payment for COD orders**: Master toggle to enable/disable feature.
   - **Advance Type**: Choose between **Fixed Amount (₹)** or **Percentage of Order Total (%)**.
   - **Advance Value**: Whole rupees for fixed amount (min ₹1) or percentage (1% to 100%).
   - **Maximum Advance Cap**: Optional ceiling for percentage calculations (e.g., 20% capped at ₹250).
   - **Customer Notice Message**: Custom notice rendered at checkout informing the customer of the advance requirement and doorstep balance.
3. **Checkout Experience**:
   - Customers selecting COD are prompted to pay the advance online via Razorpay (UPI, Cards, NetBanking).
   - The order remains `PENDING` until the advance payment is verified by Razorpay.
   - Upon verification, the order transitions to `CONFIRMED` with `paymentStatus = 'PARTIALLY_PAID'` and `paymentMethod = 'COD'`.
## 7. Delhivery One Pending Queue & Logistics Fulfillment Workflow
To eliminate charges for fake/unverified orders, Herbic Cure routes all confirmed orders to the Delhivery One **Pending Queue**:
1. **Fulfillment Mode Configuration**:
   - Managed in `/admin/settings` under **Shipping & Fulfillment > Logistics Fulfillment & Manifestation Mode**.
   - **Delhivery One Pending Queue (Recommended)**: Orders arrive in draft state. **₹0 deducted from your Delhivery wallet until staff click "Get AWB number"**.
   - **Direct Auto-Manifestation (Legacy)**: Generates AWB immediately upon order placement, deducting courier charges immediately.
2. **Staff Verification Routine**:
   - Warehouse staff open Delhivery One: **Main Menu > Orders > Forward Orders > Pending**.
   - Verify customer delivery details, phone number, and COD collection balance.
   - Click **"Get AWB number"** inside Delhivery One to manifest the order and print shipping labels.
3. **AWB Auto-Discovery & Sync**:
   - Delhivery webhooks automatically detect the `Manifested` scan and bind the generated AWB to the order in the Admin Console.
   - Admins can also click **"Check Delhivery Status / Discover AWB"** in `/admin/orders` to query Delhivery using the order reference number (`ref_ids`).
4. **Rejecting Fake Orders**:
   - If an order is identified as fake during verification, click **"Mark as Fake / Reject (₹0 Charged)"** in `/admin/orders`.
   - The order is marked `CANCELLED`, stock is restored, and zero charges are incurred from Delhivery.
5. **Monitoring & Health Checks**:
   - Endpoint `/api/admin/orders/stuck-pending` flags orders unmanifested for > 24 hours or with failed API syncs.


