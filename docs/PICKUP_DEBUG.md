# Delhivery Pickup Debugging & Root Cause Analysis

**Target Issue**: A PREPAID order is successfully manifested in Delhivery (visible in Delhivery One dashboard), but clicking "Add to pickup" repeatedly fails or does nothing.

---

## 1. Current Shipment & Pickup Flow Description

### Order Manifestation (`src/lib/shipping/delhivery.ts`)
1. **Trigger**:
   - For **Prepaid** orders: After Razorpay payment verification succeeds (`/api/payment/razorpay/verify` or webhook `/api/payment/razorpay/webhook`), `createDelhiveryShipment` is invoked.
   - For **COD** orders: Manifested immediately during checkout creation (`/api/orders/create`).
2. **Payload Sent to `/api/cmu/create.json`**:
   - `shipments[0].payment_mode`: `"Prepaid"` for online orders; `"COD"` for cash.
   - `shipments[0].cod_amount`: `"0"` for Prepaid; order total string for COD.
   - `shipments[0].quantity`: Strictly counts physical product pieces.
   - `shipments[0].weight`: `String(order.weight || 500)` grams.
   - `shipments[0].dimensions`: `shipment_length: "18"`, `shipment_width: "10"`, `shipment_height: "8"`.
   - `pickup_location`: Passed as an embedded object containing hardcoded dummy data (`add: 'Herbic Cure Central Apothecary Hub', city: 'Jaipur', pin_code: '302001', phone: '9876543210'`).
3. **Response Handling Flaw**:
   - If Delhivery responds with a valid waybill, `status: 'MANIFESTED'` and waybill are returned.
   - **Critical Vulnerability**: If Delhivery responds with `res.ok === false` or `packages[0].status === "Fail"` or remarks, the code falls through to a sandbox simulator (`simulatedWaybill: 3200...`) and reports `success: true`. This masks real Delhivery rejections from the store database.
4. **Database State**:
   - Order stores `trackingNumber` (AWB) and `carrier: 'Delhivery'`.
   - **Missing Data**: The schema currently tracks **NO pickup status** (`pickupStatus`, `pickupRequestId`, `pickupDate`, `pickupError`).
5. **Pickup Request Handling**:
   - **Zero Code**: Our application currently has **no pickup scheduling logic whatsoever**. It never calls Delhivery's official `/fm/request/new/` API, provides no admin UI button, and leaves the merchant completely reliant on manual clicks in Delhivery One.

---

## 2. Systematic Checklist & Diagnostic Audit

### A. Shipment State (Pending vs. Ready to Ship)
| Check | Status | Evidence & Findings |
| :--- | :--- | :--- |
| **Status in Delhivery One** | **LIKELY BLOCKED** | In Delhivery One, orders in `"Pending"` (draft) cannot be scheduled for pickup. Only orders transitioned to `"Ready to Ship"` (manifested with confirmed waybill) can be added to a pickup list. If an order has unverified fields or warnings in remarks, it stays in Pending. |
| **Payment Mode & COD Amount** | **PASS** | For Prepaid orders, `payment_mode` is `"Prepaid"`, `cod_amount` is `"0"`, and `total_amount` is the exact paid amount. Verified in live API test for AWB `50768210006484`. |
| **Weight & Dimensions** | **PASS** | Length (`18`), Width (`10`), Height (`8`), and Weight (`500`g) are sent as non-zero strings in every manifest payload. |
| **Physical Quantity** | **PASS** | Fixed in previous turn: `quantity` strictly reflects physical product units and never counts shipping charges as an item. |
| **Consignee Phone & Address** | **CONDITIONAL** | Delhivery's live anti-fraud system rejects dummy numbers (e.g. `9876543210` triggered `"suspicious order/consignee"` ER0005). Real 10-digit customer phones pass without issue. |

### B. Pickup Location / Warehouse
| Check | Status | Evidence & Findings |
| :--- | :--- | :--- |
| **Warehouse Name Match** | **CONFIRMED RISK** | The `pickup_location.name` passed in API payloads is `process.env.DELHIVERY_PICKUP_LOCATION` (`"Herbic Cure"`). In Delhivery One, this name must match the registered warehouse **character-for-character (case & spacing sensitive)**. If Delhivery One has it registered as e.g. `"Herbic Cure Warehouse"` or `"Herbic Cure Hub"`, the dashboard cannot correlate the package to the pickup warehouse. |
| **Embedded Dummy Address/Phone Conflict** | **CONFIRMED FLAW** | Lines 301-308 in `delhivery.ts` hardcoded dummy warehouse details: `city: 'Jaipur', pin_code: '302001', phone: '9876543210'`. Delhivery One requires the warehouse contact number to be verified via OTP. Sending a dummy phone in the manifest payload can flag the facility or conflict with the merchant's real registered warehouse in Delhivery One. |
| **Warehouse Active & Verified** | **NEEDS OWNER CHECK** | In Delhivery One > Settings > Pickup Locations, the warehouse must be in **Active** status with a verified mobile number. Unverified pickup locations prevent Delhivery One from scheduling a field executive. |

### C. Environment & Credentials
| Check | Status | Evidence & Findings |
| :--- | :--- | :--- |
| **Staging vs. Production Token** | **CONFIRMED MISMATCH** | Live test against `https://staging-express.delhivery.com/c/api/pin-codes/json/` returned `401 Unauthorized`. Live test against `https://track.delhivery.com/c/api/pin-codes/json/` returned `200 OK`. The token in `.env` (`62a610de...`) is a **production token** registered to client `621933-HerbalUnify-do`. |
| **Base URL Consistency** | **PASS** | `DELHIVERY_BASE_URL` in `.env` is `https://track.delhivery.com`. The merchant is using `one.delhivery.com` (production dashboard). Both belong to the same production environment. |

### D. Pickup Request Itself (API & Dashboard Scheduling)
| Check | Status | Evidence & Findings |
| :--- | :--- | :--- |
| **Pickup Scheduling in Code** | **CONFIRMED ABSENT** | Our codebase never calls Delhivery's official `/fm/request/new/` endpoint. Zero pickup requests are dispatched from our server. |
| **Dashboard Action ("Add to pickup")** | **LIKELY BLOCKED** | In Delhivery One dashboard, clicking "Add to pickup" sends an asynchronous request to schedule a pickup. If the browser console throws a silent JS error, or if account/wallet prerequisites fail, the button fails silently or does nothing. |
| **Pickup Time & Cut-Off** | **LIKELY BLOCKED** | Delhivery enforces daily cut-off times (typically 12:00 PM – 2:00 PM IST depending on location). Same-day pickup requests clicked after cut-off are blocked by the system. Pickups must be scheduled for the next operational business day window. |

### E. Account-Level Constraints (Delhivery One)
| Check | Status | Evidence & Findings |
| :--- | :--- | :--- |
| **Prepaid Wallet Balance** | **HIGH PROBABILITY** | Delhivery One operates as a prepaid wallet system for shipping freight. For **Prepaid** orders, shipping fees are deducted from the merchant's wallet immediately upon pickup scheduling. If the Delhivery One wallet balance is ₹0.00 or negative, clicking "Add to pickup" **silently fails or errors out with "Insufficient Wallet Balance"**. |
| **KYC & Account Activation** | **NEEDS OWNER CHECK** | Accounts with pending KYC, unverified bank details, or unaccepted service terms cannot schedule physical pickups even if order draft creation succeeds. |

### F. Code Quality & Visibility
| Check | Status | Evidence & Findings |
| :--- | :--- | :--- |
| **Error Swallowing** | **CONFIRMED FLAW** | `delhivery.ts` currently catches API errors and falls back to a sandbox simulated waybill (`3200...`), masking live API rejections. |
| **No Visibility in Admin** | **CONFIRMED FLAW** | Admin panel has no visibility into pickup state, pickup request IDs, scheduled dates, or error messages returned by Delhivery. |

---

## 3. Root Cause Classification

### Confirmed Root Causes (In Code)
1. **No Automated Pickup Integration**: The system previously had zero capability to trigger or manage Delhivery's First-Mile Pickup Request API (`/fm/request/new/`).
2. **Corrupted Warehouse Payload**: The manifest API sent hardcoded dummy data (`pin_code: '302001', city: 'Jaipur', phone: '9876543210'`) instead of purely relying on the registered warehouse name, risking conflict with Delhivery One's facility verification.
3. **Silent Error Fallbacks**: API rejections were swallowed by an offline simulation fallback, leaving staff unable to diagnose why a shipment failed downstream.

### Likely Root Causes (In Delhivery One Dashboard for "Add to pickup" failure)
1. **Insufficient Wallet Balance**: Delhivery One prepaid accounts require an active wallet balance to deduct freight for Prepaid orders before generating a pickup manifest.
2. **Same-Day Time Slot Cut-Off**: Attempting to schedule same-day pickups past the hub's operational cut-off window.
3. **Unverified Pickup Location**: If the pickup facility in Delhivery One has an unverified phone number or pending verification status, pickup dispatch is blocked.

### Owner Action Items (In Delhivery One Dashboard)
- Check **Billing / Wallet**: Ensure the Delhivery One wallet has sufficient positive balance.
- Check **Settings > Pickup Locations**: Ensure `"Herbic Cure"` is **Active** and its phone number is **OTP Verified**.
- Check **Orders > Forward Orders > Ready to Ship**: Confirm the order shows "Ready to Ship" and check browser developer console (`F12`) for exact API errors if clicking manually.
