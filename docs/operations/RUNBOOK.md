# Herbic Cure Operational Runbook

## Delhivery Logistics & Pickup Operations

### Incident: Shipment Visible in Delhivery One Dashboard But Not Added to Pickup

#### Symptoms
- A prepaid or COD order appears in the Delhivery One dashboard (under Manifests / Shipments).
- Clicking **"Add to pickup"** in the Delhivery One dashboard repeatedly fails, throws an error, or silently does nothing.
- In Admin Panel (`/admin/orders`), the pickup status displays `NONE` or `FAILED`.

---

### Root Causes & Verification Steps

#### 1. Shipment Status: "Pending" vs. "Ready to Ship" (Most Common)
- **Root Cause**: Delhivery One enforces that only packages in **"Ready to Ship"** state can be attached to a First-Mile pickup manifest. If a package is flagged during manifest generation, it remains stuck in **"Pending"** (Draft).
- **Checks in Delhivery One**:
  1. Open Delhivery One dashboard -> **Orders / Forward Shipments**.
  2. Locate the Waybill (AWB) or Order Reference #.
  3. Inspect the package status column. If it says **"Pending"**, hover or click the row to inspect **Remarks** / **Exceptions**.
  4. Common reasons for "Pending":
     - Unverified or unserviceable consignee phone number.
     - Address line shorter than required by hub sorting rules.
     - Destination pincode marked as non-serviceable for the selected payment mode.
     - Mandatory dimensions/weight missing.

#### 2. Registered Warehouse / Pickup Location Mismatch
- **Root Cause**: Delhivery First-Mile pickup service routes pickups to registered facilities.
  - The pickup location string sent in the manifest (`pickup_location: { name: DELHIVERY_PICKUP_LOCATION }`) must match **EXACTLY** (case-sensitive, identical spacing) an active warehouse registered in the **same** environment.
  - In Herbic Cure code, `DELHIVERY_PICKUP_LOCATION` defaults to `Herbic Cure`.
  - Previously, dummy facility address and phone details (`302001`, `Jaipur`, phone `9876543210`) were embedded in shipment payloads, causing warehouse configuration conflicts and OTP verification failures.
- **Checks in Delhivery One**:
  1. Go to **Settings -> Warehouses / Pickup Locations**.
  2. Verify that `Herbic Cure` exists, is **Active**, and the contact phone is verified via OTP.
  3. Verify that the registered warehouse PIN code is in a hub zone where Delhivery offers first-mile pickup.

#### 3. Delhivery Wallet Balance (Prepaid Merchant Billing)
- **Root Cause**: Prepaid customer orders require the merchant to have an active prepaid credit balance in Delhivery One to cover forward logistics freight fees before a pickup sheet can be generated.
- **Checks in Delhivery One**:
  1. Check the top-right wallet icon in Delhivery One dashboard.
  2. If the balance is ₹0 or negative, recharge the wallet via UPI / NetBanking.
  3. Once recharged, "Add to pickup" will immediately unlock.

#### 4. Daily Cut-Off Time & Slot Expiry
- **Root Cause**: Delhivery local hubs enforce a daily scheduling cut-off window (typically between **12:00 PM and 2:00 PM IST**). Attempting to book a pickup for the current day after cut-off will fail.
- **Remedy**:
  - The Herbic Cure system automatically schedules for tomorrow morning (11:00 AM IST) if booked after 1:00 PM IST.
  - In Delhivery One dashboard, select tomorrow's date if scheduling manually after 1:00 PM.

#### 5. Environment & Credentials Separation
- **Staging vs. Production**:
  - Staging URL: `https://staging-express.delhivery.com`
  - Production URL: `https://track.delhivery.com`
  - Token formats and warehouse registrations are **completely isolated**. A warehouse registered on production does not exist in staging, and a production API token will fail on staging endpoints with `401 Unauthorized`.
  - Ensure `.env` has:
    ```bash
    DELHIVERY_BASE_URL=https://track.delhivery.com
    DELHIVERY_PICKUP_LOCATION="Herbic Cure"
    ```

---

### How to Trigger Pickups from the Herbic Cure Admin Panel

1. Log into the Herbic Cure Admin dashboard (`/admin/orders`).
2. Locate the order in the table. Notice the **AWB / Pickup** column:
   - Green badge: `Pickup: Scheduled` (hover to see Request ID).
   - Red badge: `Pickup: Failed` (hover to see exact Delhivery error).
   - Gray badge: `Pickup: None`.
3. Click **Manage** on the order row.
4. Review the **Delhivery Pickup Management** card:
   - Displays Pickup Request ID, Scheduled Date, Slot, and Attempt Count.
   - If an error occurred, the exact reason returned by Delhivery is displayed in an alert banner.
5. Click **"Request Delhivery Pickup"** (or **"Reschedule Pickup"**).
   - The system calls Delhivery's `/fm/request/new/` endpoint with idempotency checks.
   - Upon success, the `pickupRequestId` is stored in the database, a `ShipmentEvent` is appended, and an immutable entry is added to `AuditLog`.

---

### Escalation: Delhivery Merchant Support Template

If the shipment is in "Ready to Ship", the pickup location name matches, the wallet is funded, and pickup scheduling still fails, raise a ticket with Delhivery Merchant Support:

```text
Subject: Unable to schedule First-Mile Pickup for Waybill [INSERT_AWB] / Client [CLIENT_ID]

Dear Delhivery Support Team,

We are experiencing an issue scheduling first-mile pickup for our forward shipment.

- Client Name / ID: 621933-HerbalUnify-do / Herbic Cure
- Waybill (AWB): [INSERT_AWB_HERE]
- Order Reference: [INSERT_ORDER_NUMBER]
- Registered Pickup Warehouse: Herbic Cure
- Environment: Production (track.delhivery.com)
- Current Shipment Status: Ready to Ship / Manifested
- Action Attempted: First-Mile Pickup Request via API (/fm/request/new/) and Delhivery One Dashboard
- Error Encountered: [PASTE_ERROR_MESSAGE_HERE]

Please inspect why this shipment cannot be linked to a pickup request and advise if any hub routing or account restriction is blocking first-mile scheduling.

Thank you,
Herbic Cure Operations Team
```

---

### Incident: Order Staged in Delhivery One Pending Queue But AWB Not Discovered

#### Symptoms
- Warehouse staff manifested the order ("Get AWB number") in Delhivery One dashboard, but `/admin/orders` still says `Delhivery Pending`.

#### Resolution Steps
1. In `/admin/orders`, click **Manage** on the order.
2. Click **"Check Delhivery Status / Discover AWB"**.
   - The system calls `/api/admin/orders/[id]/sync-delhivery`.
   - The endpoint queries Delhivery's `/api/v1/packages/json/?ref_ids=HC-XXXXX` and pulls the newly assigned AWB into the database, transitioning the order status to `READY_TO_SHIP`.
3. To batch-discover all newly manifested orders, trigger:
   - `POST /api/admin/orders/stuck-pending`
   - This queries up to 50 unmanifested orders simultaneously and binds all generated AWBs.
4. Verify webhook delivery:
   - Delhivery One sends webhook payloads on `Manifested` events to: `https://herbiccure.com/api/shipping/delhivery/webhook`.
   - Ensure the webhook URL is registered in your Delhivery One account under **Settings > Webhooks**.

