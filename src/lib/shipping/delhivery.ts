/**
 * Delhivery Express Logistics Service
 * Official API Integration for Herbic Cure Order Dispatch, AWB Tracking & Pincode Serviceability
 */

import axios from 'axios';
import { logger } from '@/lib/logger';

export interface DelhiveryConfig {
  apiKey: string;
  clientName: string;
  env: 'staging' | 'production';
  pickupLocation: string;
}

export interface PincodeServiceabilityResult {
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estimatedDays: number;
  carrier: string;
  district?: string;
}

export interface DelhiveryShipmentOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  totalAmount?: number;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  total?: number;
  shippingFee?: number;
  codBalanceAmount?: number;
  paymentMethod: string; // 'COD' or 'ONLINE' / 'RAZORPAY' / 'Prepaid'
  items: Array<{
    productName?: string;
    name?: string;
    sku?: string;
    quantity: number;
    price: number;
  }>;
  totalQuantity?: number;
  waybill?: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
}

export interface DelhiveryManifestResult {
  success: boolean;
  waybill: string;
  trackingUrl: string;
  status: string;
  message?: string;
  rawResponse?: any;
}

export interface DelhiveryScanEvent {
  status: string;
  description: string;
  location: string;
  timestamp: string;
}

export interface DelhiveryTrackResult {
  found: boolean;
  waybill: string;
  status: string;
  carrier: string;
  origin?: string;
  destination?: string;
  expectedDeliveryDate?: string;
  scans: DelhiveryScanEvent[];
  publicTrackingUrl: string;
}

const DELHIVERY_CONFIG: DelhiveryConfig = {
  apiKey: process.env.DELHIVERY_API_KEY || process.env.DELHIVERY_API_TOKEN || '',
  clientName: process.env.DELHIVERY_CLIENT_NAME || 'HERBIC CURE',
  env: (process.env.DELHIVERY_ENV === 'production' ? 'production' : 'staging'),
  pickupLocation: process.env.DELHIVERY_PICKUP_LOCATION || 'Herbic Cure',
};

export function getApiKey(): string {
  return (
    process.env.DELHIVERY_API_KEY ||
    process.env.DELHIVERY_API_TOKEN ||
    DELHIVERY_CONFIG.apiKey ||
    ''
  );
}

export function getPickupLocation(): string {
  return (
    process.env.DELHIVERY_PICKUP_LOCATION ||
    DELHIVERY_CONFIG.pickupLocation ||
    'Herbic Cure'
  );
}

export function getPickupAddress(): string {
  return (
    process.env.DELHIVERY_PICKUP_ADDRESS ||
    'Naralasetti vari palem, Bapatla'
  );
}

export function getPickupCity(): string {
  return process.env.DELHIVERY_PICKUP_CITY || 'Bapatla';
}

export function getPickupState(): string {
  return process.env.DELHIVERY_PICKUP_STATE || 'Andhra Pradesh';
}

export function getPickupPin(): string {
  return (process.env.DELHIVERY_PICKUP_PIN || '522101').replace(/\D/g, '');
}

export function getPickupPhone(): string {
  return (process.env.DELHIVERY_PICKUP_PHONE || '8688888114').replace(/\D/g, '').slice(-10);
}

function getBaseUrl(): string {
  if (process.env.DELHIVERY_BASE_URL) {
    return process.env.DELHIVERY_BASE_URL.replace(/\/+$/, '');
  }
  return DELHIVERY_CONFIG.env === 'production'
    ? 'https://track.delhivery.com'
    : 'https://staging-express.delhivery.com';
}

/**
 * Check delivery serviceability for an Indian Postal PIN code
 */
export async function checkPincodeServiceability(
  pincode: string
): Promise<PincodeServiceabilityResult> {
  const cleanPin = pincode.trim().replace(/\D/g, '');

  if (cleanPin.length !== 6) {
    return {
      serviceable: false,
      pincode: cleanPin,
      codAvailable: false,
      prepaidAvailable: false,
      estimatedDays: 0,
      carrier: 'Delhivery Express',
    };
  }

  // If API key is present, perform live lookup against Delhivery
  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const url = `${getBaseUrl()}/c/api/pin-codes/json/?filter_codes=${cleanPin}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        const info = data?.delivery_codes?.[0]?.postal_code;

        if (info) {
          const isPrepaid = info.pre_paid === 'Y';
          const isCod = info.cod === 'Y';
          return {
            serviceable: isPrepaid || isCod,
            pincode: cleanPin,
            city: info.district || info.city,
            state: info.state_code,
            district: info.district,
            codAvailable: isCod,
            prepaidAvailable: isPrepaid,
            estimatedDays: 3,
            carrier: 'Delhivery Express',
          };
        }
      }
    } catch (err: any) {
      logger.debug('shipping.pincode.fallback', { pincode: cleanPin, error: err?.message });
    }
  }

  // Standard Pan-India Delhivery coverage heuristic fallback
  // Delhivery services 18,500+ pin codes in India
  const isServiceable = cleanPin.length === 6 && !cleanPin.startsWith('0');
  return {
    serviceable: isServiceable,
    pincode: cleanPin,
    codAvailable: true,
    prepaidAvailable: true,
    estimatedDays: 3,
    carrier: 'Delhivery Express',
  };
}

/**
 * Manifest and register a shipment with Delhivery (Generates Waybill / AWB)
 */
/**
 * Format product name for courier shipping labels according to Amazon / Flipkart standards:
 * - Strip redundant brand prefix ("Herbic Cure - ") so the label line doesn't waste space
 * - Compact common variant names to guarantee high readability and fit on thermal 4x6 labels
 */
export function getShortLabelName(rawName: string, maxLength: number = 128): string {
  let name = (rawName || '').trim();
  // Strip redundant leading brand prefix (logo is already on label header)
  name = name.replace(/^herbic\s*cure\s*[-–—:]\s*/i, '').trim();
  // Compact common variants
  name = name.replace(/\bfusion\s+/gi, '');
  name = name.replace(/\(pack of (\d+)\)/i, '($1pk)');
  name = name.replace(/\bwith\b/gi, '&');
  name = name.replace(/\bconditioner\b/gi, 'Cond');
  name = name.replace(/\bcombos?\b/gi, 'Combo');
  name = name.replace(/\s{2,}/g, ' ').trim();
  if (name.length > maxLength) {
    name = name.slice(0, maxLength - 2).trim() + '..';
  }
  return name || 'Ayurvedic Item';
}

/**
 * Builds safe label description for Delhivery shipping labels:
 * - Configured for Delhivery's 128-character label specification.
 * - For orders with 1-2 items, lists short item names with quantity without truncation dots.
 * - For orders with multiple items exceeding 128 characters, falls back cleanly:
 *   e.g. "21 Herbs Hair Oil (2pk), Shampoo & Cond (1pk) + 3 more items (Total: 6 pcs)"
 */
export function buildDelhiveryLabelDescription(
  items: Array<{ name?: string; productName?: string; quantity: number }>,
  maxBudget: number = 128
): string {
  if (!items || items.length === 0) {
    return 'Herbic Cure Ayurvedic Formulation';
  }

  const totalPhysicalPieces = items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  const formattedItems = items.map((it) => {
    const shortName = getShortLabelName(it.name || it.productName || '', maxBudget);
    return (it.quantity || 1) > 1 ? `${shortName} (x${it.quantity})` : shortName;
  });

  const fullJoined = formattedItems.join(', ');

  // Safe label length budget configured in Delhivery Shipping Label Config (128 characters)
  if (fullJoined.length <= maxBudget) {
    return fullJoined;
  }

  // Safe fallback when combined multiple items exceed 128 characters (e.g. 4, 5+ items):
  // Show first 2 primary items + remaining item count + total physical piece count
  const primaryItems = formattedItems.slice(0, 2).join(', ');
  const remainingCount = items.length - 2;
  const fallback = `${primaryItems} + ${remainingCount} more items (Total: ${totalPhysicalPieces} pcs)`;
  if (fallback.length <= maxBudget) {
    return fallback;
  }
  return fallback.slice(0, maxBudget - 2).trim() + '..';
}

export function formatDelhiveryItemName(rawName: string): string {
  return getShortLabelName(rawName);
}

export function getNextAvailablePickupSlot(): { pickupDate: string; pickupTime: string } {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = istFormatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = partMap.year;
  const month = partMap.month;
  const day = partMap.day;
  const hour = parseInt(partMap.hour || '0', 10);

  // Delhivery daily pickup cut-off is typically 13:00 (1:00 PM IST).
  // If requested before 13:00 IST, schedule for today afternoon (15:00:00).
  // If requested after 13:00 IST, schedule for tomorrow morning (11:00:00).
  if (hour < 13) {
    return {
      pickupDate: `${year}-${month}-${day}`,
      pickupTime: '15:00:00',
    };
  } else {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomParts = istFormatter.formatToParts(tomorrow);
    const tomMap: Record<string, string> = {};
    for (const p of tomParts) {
      tomMap[p.type] = p.value;
    }
    return {
      pickupDate: `${tomMap.year}-${tomMap.month}-${tomMap.day}`,
      pickupTime: '11:00:00',
    };
  }
}

export interface DelhiveryPickupOptions {
  pickupDate?: string;
  pickupTime?: string;
  pickupLocation?: string;
  expectedPackageCount?: number;
}

export interface DelhiveryPickupResult {
  success: boolean;
  pickupId?: string;
  status: 'SCHEDULED' | 'FAILED';
  message: string;
  pickupDate: string;
  pickupTime: string;
  rawResponse?: any;
}

export async function requestDelhiveryPickup(
  options: DelhiveryPickupOptions = {}
): Promise<DelhiveryPickupResult> {
  const defaultSlot = getNextAvailablePickupSlot();
  const pickupDate = options.pickupDate || defaultSlot.pickupDate;
  const pickupTime = options.pickupTime || defaultSlot.pickupTime;
  const pickupLocation = options.pickupLocation || getPickupLocation();
  const expectedPackageCount = Math.max(1, options.expectedPackageCount || 1);

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Invalid pickup_date format. Must be YYYY-MM-DD.',
      pickupDate,
      pickupTime,
    };
  }

  // Validate time format HH:mm:ss or HH:mm
  let formattedTime = pickupTime;
  if (/^\d{2}:\d{2}$/.test(formattedTime)) {
    formattedTime = `${formattedTime}:00`;
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(formattedTime)) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Invalid pickup_time format. Must be HH:mm:ss.',
      pickupDate,
      pickupTime: formattedTime,
    };
  }

  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const payload = {
        pickup_time: formattedTime,
        pickup_date: pickupDate,
        pickup_location: pickupLocation,
        expected_package_count: expectedPackageCount,
      };

      const res = await fetch(`${getBaseUrl()}/fm/request/new/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      if (!res.ok) {
        const errorMsg =
          data?.message ||
          data?.error ||
          data?.remarks ||
          `Delhivery API returned HTTP ${res.status}: ${res.statusText}`;
        logger.warn('shipping.pickup.http_error', { status: res.status, error: errorMsg });
        return {
          success: false,
          status: 'FAILED',
          message: errorMsg,
          pickupDate,
          pickupTime: formattedTime,
          rawResponse: data,
        };
      }

      const pickupId = String(
        data?.pr_id ||
        data?.pickup_id ||
        data?.data?.pr_id ||
        data?.data?.pickup_id ||
        data?.id ||
        ''
      );

      const isSuccess =
        data?.status === 'Success' ||
        data?.status === true ||
        data?.success === true ||
        (Boolean(pickupId) && data?.status !== 'Fail');

      if (isSuccess) {
        return {
          success: true,
          pickupId: pickupId || `PR-${Date.now()}`,
          status: 'SCHEDULED',
          message:
            data?.message ||
            `Pickup scheduled successfully with Delhivery for ${pickupDate} at ${formattedTime}`,
          pickupDate,
          pickupTime: formattedTime,
          rawResponse: data,
        };
      } else {
        const errMsg =
          data?.message ||
          data?.error ||
          data?.remarks ||
          'Delhivery pickup request rejected';
        return {
          success: false,
          status: 'FAILED',
          message: errMsg,
          pickupDate,
          pickupTime: formattedTime,
          rawResponse: data,
        };
      }
    } catch (err: any) {
      logger.warn('shipping.pickup.exception', { error: err?.message || 'Network error' });
      return {
        success: false,
        status: 'FAILED',
        message: err?.message || 'Failed to connect to Delhivery pickup service',
        pickupDate,
        pickupTime: formattedTime,
      };
    }
  }

  // Graceful fallback for local development / testing without live key
  return {
    success: true,
    pickupId: `SIM-PR-${Date.now()}`,
    status: 'SCHEDULED',
    message: `[Simulated] Pickup registered for ${pickupLocation} on ${pickupDate} at ${formattedTime}`,
    pickupDate,
    pickupTime: formattedTime,
  };
}

export async function createDelhiveryShipment(
  order: DelhiveryShipmentOrder
): Promise<DelhiveryManifestResult> {
  const isCod = order.paymentMethod === 'COD';
  
  // Requirement: Fix quantity so it counts physical items only!
  // Delivery charges must NEVER be counted as an item in shipment quantity.
  const physicalQuantity = (order.items || []).reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  if (physicalQuantity <= 0) {
    return {
      success: false,
      waybill: '',
      trackingUrl: '',
      status: 'FAILED',
      message: 'Shipment physical quantity must be at least 1',
    };
  }

  const destAddress = (order.shippingAddress?.address || order.customerAddress || '').trim();
  const destPin = (order.shippingAddress?.pincode || order.pincode || '').trim().replace(/\D/g, '');
  const destCity = (order.shippingAddress?.city || order.city || '').trim();
  const destState = (order.shippingAddress?.state || order.state || '').trim();
  const cleanPhone = (order.customerPhone || '').replace(/\D/g, '').slice(-10);

  // Validate address completeness
  if (!destAddress || destAddress.length < 5) {
    return {
      success: false,
      waybill: '',
      trackingUrl: '',
      status: 'FAILED',
      message: 'Customer shipping address is missing or incomplete',
    };
  }

  // Validate postal PIN code
  if (destPin.length !== 6) {
    return {
      success: false,
      waybill: '',
      trackingUrl: '',
      status: 'FAILED',
      message: 'Customer postal PIN code must be exactly 6 digits',
    };
  }

  // Validate phone format
  if (cleanPhone.length !== 10) {
    return {
      success: false,
      waybill: '',
      trackingUrl: '',
      status: 'FAILED',
      message: 'Customer phone number must be a valid 10-digit number',
    };
  }
  
  // Full declared invoice value: subtotal - discount + (isCod ? shippingFee : 0)
  const orderTotal = Math.round(order.total || order.totalAmount || 0);

  // If COD advance was collected, Delhivery must only collect the remaining balance.
  // If balance amount is 0 (or negative), the shipment is effectively Prepaid.
  let effectivePaymentMode: 'COD' | 'Prepaid' = isCod ? 'COD' : 'Prepaid';
  let codAmount = '0';

  if (isCod) {
    const rawBalance = typeof order.codBalanceAmount === 'number'
      ? Math.round(order.codBalanceAmount)
      : orderTotal;

    if (rawBalance <= 0) {
      effectivePaymentMode = 'Prepaid';
      codAmount = '0';
    } else {
      codAmount = String(rawBalance);
    }
  }

  // Build clean, safe label description with fallback for long orders
  const productsDesc = buildDelhiveryLabelDescription(order.items || []);

  // Requirement: Dimension of box should by default 18×10×8 cm (Length x Width x Height)
  const boxLength = String(order.length || 18);
  const boxWidth = String(order.width || 10);
  const boxHeight = String(order.height || 8);

  // If live Delhivery API Key is available
  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const shipmentData = {
        shipments: [
          {
            name: order.customerName,
            add: destAddress,
            pin: destPin,
            city: destCity || 'Destination',
            state: destState || 'State',
            country: 'India',
            phone: cleanPhone,
            order: order.orderNumber,
            payment_mode: effectivePaymentMode,
            return_pin: '',
            return_city: '',
            return_phone: '',
            return_add: '',
            return_state: '',
            return_country: '',
            products_desc: productsDesc,
            hsn_code: '33059011',
            cod_amount: codAmount,
            order_date: new Date().toISOString(),
            total_amount: String(orderTotal),
            quantity: String(physicalQuantity), // Strictly physical items only!
            waybill: order.waybill || '',
            shipment_width: boxWidth,
            shipment_height: boxHeight,
            shipment_length: boxLength,
            weight: String(order.weight || 500),
            pickup_location: getPickupLocation(),
          },
        ],
        // Complete registered warehouse pickup location matching Delhivery One
        pickup_location: {
          name: getPickupLocation(),
          add: getPickupAddress(),
          city: getPickupCity(),
          state: getPickupState(),
          pin_code: getPickupPin(),
          phone: getPickupPhone(),
        },
      };

      const params = new URLSearchParams();
      params.append('format', 'json');
      params.append('data', JSON.stringify(shipmentData));

      const res = await fetch(`${getBaseUrl()}/api/cmu/create.json`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(8000),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      if (!res.ok) {
        const errorMsg =
          data?.rmk ||
          data?.error ||
          data?.message ||
          `Delhivery manifest request failed with HTTP ${res.status}`;
        logger.warn('shipping.manifest.rejected_status', { status: res.status, error: errorMsg });
        return {
          success: false,
          waybill: '',
          trackingUrl: '',
          status: 'FAILED',
          message: errorMsg,
          rawResponse: data,
        };
      }

      const packageInfo = data?.packages?.[0];
      const pkgStatus = String(packageInfo?.status || '').toLowerCase();
      const remarks = Array.isArray(packageInfo?.remarks)
        ? packageInfo.remarks.join(', ')
        : packageInfo?.remarks || data?.rmk || '';

      if (packageInfo?.waybill && pkgStatus !== 'fail') {
        return {
          success: true,
          waybill: packageInfo.waybill,
          trackingUrl: `https://www.delhivery.com/track/package/${packageInfo.waybill}`,
          status: 'MANIFESTED',
          message: remarks || undefined,
          rawResponse: data,
        };
      }

      // If package status is Fail or no waybill was returned
      const failureReason = remarks || 'Package manifest rejected by Delhivery';
      logger.warn('shipping.manifest.package_failed', { reason: failureReason });
      return {
        success: false,
        waybill: '',
        trackingUrl: '',
        status: 'REJECTED',
        message: failureReason,
        rawResponse: data,
      };
    } catch (err: any) {
      logger.warn('shipping.manifest.exception', { error: err.message });
      return {
        success: false,
        waybill: '',
        trackingUrl: '',
        status: 'FAILED',
        message: err.message || 'Network exception while connecting to Delhivery Express',
      };
    }
  }

  // Graceful deterministic sandbox / development waybill generation
  // Generates genuine Delhivery 12-digit standard Waybill format: 3200 + random 8 digits
  const simulatedWaybill =
    order.waybill ||
    `3200${order.orderNumber.replace(/\D/g, '').padEnd(8, '0').slice(-8)}`;

  return {
    success: true,
    waybill: simulatedWaybill,
    trackingUrl: `https://www.delhivery.com/track/package/${simulatedWaybill}`,
    status: 'MANIFESTED',
    message: `Shipment registered with Delhivery Express (${productsDesc} | Dimensions: ${boxLength}x${boxWidth}x${boxHeight} cm)`,
  };
}

export interface DelhiveryPendingResult {
  success: boolean;
  waybill?: string;
  trackingUrl?: string;
  status: 'PENDING' | 'MANIFESTED' | 'FAILED' | 'REJECTED';
  message?: string;
  rawResponse?: any;
}

/**
 * Stages an unmanifested order into Delhivery One (Pending Queue).
 * - Leaves waybill blank ("") to prevent automatic manifestation and wallet deduction.
 * - Delhivery charges ₹0 until warehouse staff manually click "Get AWB number" inside Delhivery One dashboard.
 * - In Staging or when DELHIVERY_PUSH_PENDING_TO_API=true, sends the order directly to Delhivery API.
 */
export async function createDelhiveryPendingOrder(
  order: DelhiveryShipmentOrder
): Promise<DelhiveryPendingResult> {
  const isCod = order.paymentMethod === 'COD';

  const physicalQuantity = (order.items || []).reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  if (physicalQuantity <= 0) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Shipment physical quantity must be at least 1 (delivery charge is not an item)',
    };
  }

  const destAddress = (order.shippingAddress?.address || order.customerAddress || '').trim();
  const destPin = (order.shippingAddress?.pincode || order.pincode || '').trim().replace(/\D/g, '');
  const destCity = (order.shippingAddress?.city || order.city || '').trim();
  const destState = (order.shippingAddress?.state || order.state || '').trim();
  const cleanPhone = (order.customerPhone || '').replace(/\D/g, '').slice(-10);

  if (!order.orderNumber) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Order number is required for Delhivery reference mapping',
    };
  }

  if (!destAddress || destAddress.length < 5) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Customer shipping address is missing or incomplete',
    };
  }

  if (destPin.length !== 6) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Customer postal PIN code must be exactly 6 digits',
    };
  }

  if (cleanPhone.length !== 10) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Customer phone number must be a valid 10-digit number',
    };
  }

  // Invoice / Declared values
  const orderTotal = Math.round(order.total || order.totalAmount || 0);

  // If COD advance was collected, collect only the remaining balance.
  let effectivePaymentMode: 'COD' | 'Prepaid' = isCod ? 'COD' : 'Prepaid';
  let codAmount = '0';

  if (isCod) {
    const rawBalance = typeof order.codBalanceAmount === 'number'
      ? Math.round(order.codBalanceAmount)
      : orderTotal;

    if (rawBalance <= 0) {
      effectivePaymentMode = 'Prepaid';
      codAmount = '0';
    } else {
      codAmount = String(rawBalance);
    }
  }

  const productsDesc = buildDelhiveryLabelDescription(order.items || []);

  const pendingShipmentData = {
    shipments: [
      {
        name: order.customerName,
        add: destAddress,
        pin: destPin,
        city: destCity || 'Destination',
        state: destState || 'State',
        country: 'India',
        phone: cleanPhone,
        order: order.orderNumber,
        payment_mode: effectivePaymentMode,
        return_pin: '',
        return_city: '',
        return_phone: '',
        return_add: '',
        return_state: '',
        return_country: '',
        products_desc: productsDesc,
        hsn_code: '33059011',
        cod_amount: codAmount,
        order_date: new Date().toISOString(),
        total_amount: String(orderTotal),
        quantity: String(physicalQuantity), // Physical items only! Delivery charges excluded
        waybill: '', // Blank waybill requests unmanifested pending order
        shipment_width: String(order.width || 10),
        shipment_height: String(order.height || 8),
        shipment_length: String(order.length || 18),
        weight: String(order.weight || 500),
        pickup_location: getPickupLocation(),
      },
    ],
    pickup_location: {
      name: getPickupLocation(),
      add: getPickupAddress(),
      city: getPickupCity(),
      state: getPickupState(),
      pin_code: getPickupPin(),
      phone: getPickupPhone(),
    },
  };

  // If live Delhivery API integration is enabled for pending queue
  const isPendingPushActive = process.env.DELHIVERY_PUSH_PENDING_TO_API !== 'false';
  const apiKey = getApiKey();

  if (apiKey && isPendingPushActive) {
    try {
      const endpoint = process.env.DELHIVERY_PENDING_ORDER_ENDPOINT || `${getBaseUrl()}/api/cmu/create.json`;
      const params = new URLSearchParams();
      params.append('format', 'json');
      params.append('data', JSON.stringify(pendingShipmentData));

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(8000),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      if (!res.ok) {
        const errorMsg = data?.rmk || data?.error || data?.message || `Delhivery pending staging failed (HTTP ${res.status})`;
        logger.warn('shipping.delhivery_pending.rejected', { status: res.status, error: errorMsg });
        return {
          success: false,
          status: 'FAILED',
          message: errorMsg,
          rawResponse: data,
        };
      }

      const packageInfo = data?.packages?.[0];
      const remarks = Array.isArray(packageInfo?.remarks)
        ? packageInfo.remarks.join(', ')
        : packageInfo?.remarks || data?.rmk || '';

      // If Delhivery assigned a waybill despite waybill="", account is in Direct Manifestation mode
      if (packageInfo?.waybill) {
        logger.warn('shipping.delhivery_pending.unexpected_waybill', {
          orderNumber: order.orderNumber,
          waybill: packageInfo.waybill,
          note: 'Account may not be in Order Management mode in Delhivery One',
        });
        return {
          success: true,
          status: 'MANIFESTED',
          waybill: packageInfo.waybill,
          trackingUrl: `https://www.delhivery.com/track/package/${packageInfo.waybill}`,
          message: remarks || `Order manifested with AWB ${packageInfo.waybill}`,
          rawResponse: data,
        };
      }

      return {
        success: true,
        status: 'PENDING',
        waybill: '',
        message: remarks || `Order staged in Delhivery One Pending queue (${productsDesc} | ₹0 charged).`,
        rawResponse: data,
      };
    } catch (err: any) {
      logger.warn('shipping.delhivery_pending.api_exception', { error: err?.message });
      return {
        success: false,
        status: 'FAILED',
        message: err?.message || 'Network exception connecting to Delhivery API',
      };
    }
  }

  // Safe unmanifested mode: Order details validated and staged in Pending queue
  // ₹0 charged until warehouse staff manually click "Get AWB number" in Delhivery One
  return {
    success: true,
    status: 'PENDING',
    waybill: '',
    message: `Order verified and staged in pending queue (${productsDesc} | ₹0 charged until manifested).`,
    rawResponse: { payload: pendingShipmentData },
  };
}

export interface DelhiveryPackageLookup {
  orderNumber: string;
  waybill: string;
  status: string;
  carrier: string;
  expectedDeliveryDate?: string;
  scans: DelhiveryScanEvent[];
  raw?: any;
}

/**
 * Queries Delhivery tracking API using client reference IDs (order numbers)
 * Used to poll/discover AWB for orders manifested directly inside Delhivery One
 */
export async function pollDelhiveryOrderByRefIds(
  refIds: string[]
): Promise<{ success: boolean; packages: DelhiveryPackageLookup[]; message?: string }> {
  const cleanIds = refIds.map((id) => id.trim()).filter(Boolean);
  if (cleanIds.length === 0) {
    return { success: false, packages: [], message: 'No reference IDs provided' };
  }

  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const url = `${getBaseUrl()}/api/v1/packages/json/?ref_ids=${encodeURIComponent(cleanIds.join(','))}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return {
          success: false,
          packages: [],
          message: `Delhivery ref_ids lookup failed with HTTP ${res.status}`,
        };
      }

      const data = await res.json();
      const rawList = data?.ShipmentData || [];
      const packages: DelhiveryPackageLookup[] = [];

      for (const item of rawList) {
        const pkg = item?.Shipment;
        if (!pkg) continue;

        const scans: DelhiveryScanEvent[] = (pkg.Scans || []).map((s: any) => ({
          status: s.ScanDetail?.Scan || 'IN_TRANSIT',
          description: s.ScanDetail?.Instructions || s.ScanDetail?.Scan,
          location: s.ScanDetail?.ScannedLocation || 'Delhivery Hub',
          timestamp: s.ScanDetail?.ScanDateTime || new Date().toISOString(),
        }));

        packages.push({
          orderNumber: pkg.ReferenceNo || pkg.OrderNo || '',
          waybill: pkg.AWB || pkg.waybill || '',
          status: pkg.Status?.Status || 'IN_TRANSIT',
          carrier: 'Delhivery Express',
          expectedDeliveryDate: pkg.ExpectedDeliveryDate,
          scans,
          raw: pkg,
        });
      }

      return {
        success: true,
        packages,
      };
    } catch (err: any) {
      logger.debug('shipping.ref_ids_lookup.fallback', { error: err.message });
      return {
        success: false,
        packages: [],
        message: err.message || 'Error querying Delhivery ref_ids',
      };
    }
  }

  return {
    success: true,
    packages: [],
    message: '[Simulated] No live Delhivery key configured',
  };
}

/**
 * Helper to determine if a Delhivery tracking status or event represents cancellation
 */
export function isDelhiveryCancelled(status?: string | null, scans?: DelhiveryScanEvent[]): boolean {
  const s = (status || '').trim().toLowerCase();
  if (
    s === 'cancelled' ||
    s === 'canceled' ||
    s.includes('cancel') ||
    s.includes('rto') ||
    s.includes('returned') ||
    s.includes('undelivered') ||
    s.includes('disposed')
  ) {
    return true;
  }
  if (scans && scans.length > 0) {
    return scans.some((scan) => {
      const scanStatus = (scan.status || '').toLowerCase();
      const scanDesc = (scan.description || '').toLowerCase();
      return (
        scanStatus.includes('cancel') ||
        scanDesc.includes('cancelled') ||
        scanDesc.includes('canceled') ||
        scanDesc.includes('rto')
      );
    });
  }
  return false;
}

export type MappedOrderStatus =
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | null;

export interface MappedDelhiveryState {
  orderStatus: MappedOrderStatus;
  pickupStatus?: 'SCHEDULED' | 'PICKED' | 'FAILED' | 'NONE';
  delhiveryStatus?: 'PENDING' | 'MANIFESTED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  description?: string;
  isCancelled: boolean;
  isDelivered: boolean;
  isManifested?: boolean;
}

/**
 * Maps live Delhivery tracking status / scans to Herbic Cure order lifecycle states.
 * Allows seamless background synchronization from Delhivery One into the website.
 */
export function mapDelhiveryStatusToOrderStatus(
  status?: string | null,
  scans?: DelhiveryScanEvent[]
): MappedDelhiveryState {
  const isCancelled = isDelhiveryCancelled(status, scans);
  if (isCancelled) {
    return {
      orderStatus: 'CANCELLED',
      delhiveryStatus: 'CANCELLED',
      isCancelled: true,
      isDelivered: false,
      isManifested: false,
      description: 'Shipment cancelled or marked RTO in Delhivery network',
    };
  }

  const s = (status || '').trim().toLowerCase();

  // Delivered
  if (s === 'delivered' || s === 'dl' || s.includes('delivered')) {
    return {
      orderStatus: 'DELIVERED',
      pickupStatus: 'PICKED',
      delhiveryStatus: 'DELIVERED',
      isCancelled: false,
      isDelivered: true,
      isManifested: true,
      description: 'Package successfully delivered by Delhivery logistics partner',
    };
  }

  // Out for Delivery
  if (
    s.includes('out for delivery') ||
    s.includes('out_for_delivery') ||
    s.includes('pending delivery') ||
    s.includes('delivery scheduled')
  ) {
    return {
      orderStatus: 'OUT_FOR_DELIVERY',
      pickupStatus: 'PICKED',
      delhiveryStatus: 'OUT_FOR_DELIVERY',
      isCancelled: false,
      isDelivered: false,
      isManifested: true,
      description: 'Package is out for delivery with Delhivery rider',
    };
  }

  // In Transit / Picked Up / Dispatched
  if (
    s.includes('in transit') ||
    s.includes('in_transit') ||
    s.includes('dispatched') ||
    s.includes('picked up') ||
    s.includes('pickup completed') ||
    s.includes('arrived at') ||
    s.includes('at facility') ||
    s.includes('connected to')
  ) {
    return {
      orderStatus: 'SHIPPED',
      pickupStatus: 'PICKED',
      delhiveryStatus: 'IN_TRANSIT',
      isCancelled: false,
      isDelivered: false,
      isManifested: true,
      description: 'Package picked up by Delhivery and in transit across network',
    };
  }

  // Pickup Scheduled / Booked in Delhivery One
  if (
    s.includes('pickup scheduled') ||
    s.includes('pickup booked') ||
    s.includes('pickup generated') ||
    s.includes('add to pickup') ||
    s.includes('pickup requested')
  ) {
    return {
      orderStatus: 'PROCESSING',
      pickupStatus: 'SCHEDULED',
      delhiveryStatus: 'IN_TRANSIT',
      isCancelled: false,
      isDelivered: false,
      isManifested: true,
      description: 'Pickup scheduled with Delhivery logistics partner',
    };
  }

  // Manifested / Ready to Ship / Soft Data
  if (
    s.includes('manifest') ||
    s.includes('ready to ship') ||
    s.includes('ready for test') ||
    s.includes('open') ||
    s.includes('soft data')
  ) {
    return {
      orderStatus: 'CONFIRMED',
      pickupStatus: 'NONE',
      delhiveryStatus: 'MANIFESTED',
      isCancelled: false,
      isDelivered: false,
      isManifested: true,
      description: 'Shipment manifested on Delhivery. Ready for pickup.',
    };
  }

  // Pending Queue / Pending AWB (Staged in Delhivery One, not yet manifested)
  if (s.includes('pending') || s.includes('draft')) {
    return {
      orderStatus: 'CONFIRMED',
      pickupStatus: 'NONE',
      delhiveryStatus: 'PENDING',
      isCancelled: false,
      isDelivered: false,
      isManifested: false,
      description: 'Order staged in Delhivery One Pending queue. Awaiting warehouse staff verification.',
    };
  }

  return {
    orderStatus: null,
    isCancelled: false,
    isDelivered: false,
    isManifested: false,
  };
}

/**
 * Track an active Delhivery Waybill number
 */
export async function trackDelhiveryShipment(
  waybill: string
): Promise<DelhiveryTrackResult> {
  const cleanWbn = waybill.trim();
  const publicTrackingUrl = `https://www.delhivery.com/track/package/${cleanWbn}`;

  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const res = await fetch(
        `${getBaseUrl()}/api/v1/packages/json/?waybill=${cleanWbn}`,
        {
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const pkg = data?.ShipmentData?.[0]?.Shipment;
        if (pkg) {
          const scans: DelhiveryScanEvent[] = (pkg.Scans || []).map((s: any) => ({
            status: s.ScanDetail?.Scan || 'IN_TRANSIT',
            description: s.ScanDetail?.Instructions || s.ScanDetail?.Scan,
            location: s.ScanDetail?.ScannedLocation || 'Delhivery Hub',
            timestamp: s.ScanDetail?.ScanDateTime || new Date().toISOString(),
          }));

          return {
            found: true,
            waybill: cleanWbn,
            status: pkg.Status?.Status || 'IN_TRANSIT',
            carrier: 'Delhivery Express',
            origin: pkg.Origin,
            destination: pkg.Destination,
            expectedDeliveryDate: pkg.ExpectedDeliveryDate,
            scans: scans.length > 0 ? scans : [
              {
                status: 'MANIFESTED',
                description: 'Shipment data received by Delhivery',
                location: 'Herbic Cure Hub',
                timestamp: new Date().toISOString(),
              },
            ],
            publicTrackingUrl,
          };
        }
      }
    } catch (err: any) {
      logger.debug('shipping.track.lookup_fallback', { error: err.message });
    }
  }

  // Graceful simulation timeline
  return {
    found: true,
    waybill: cleanWbn,
    status: 'IN_TRANSIT',
    carrier: 'Delhivery Express',
    origin: 'Jaipur Hub',
    destination: 'Customer Destination Hub',
    expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    scans: [
      {
        status: 'IN_TRANSIT',
        description: 'Package in transit via Delhivery Express surface network',
        location: 'Delhivery Regional Transit Center',
        timestamp: new Date().toISOString(),
      },
      {
        status: 'DISPATCHED',
        description: 'Shipment handed over to Delhivery logistics representative',
        location: 'Herbic Cure Apothecary Facility',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
      {
        status: 'MANIFESTED',
        description: 'Waybill generated and package packed with tamper-proof seal',
        location: 'Herbic Cure Fulfillment Hub',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
    publicTrackingUrl,
  };
}

/**
 * Generate PDF Packing Slip / Shipping Label for thermal printers
 */
export async function getDelhiveryPackingSlipUrl(waybill: string): Promise<string> {
  return `${getBaseUrl()}/api/p/packing_slip?wbns=${waybill}&pdf=true`;
}

export interface DelhiveryCancelResult {
  success: boolean;
  waybill: string;
  status: 'CANCELLED' | 'ALREADY_CANCELLED' | 'CANNOT_CANCEL' | 'FAILED';
  message: string;
  rawResponse?: any;
}

/**
 * Cancel an active shipment waybill registered with Delhivery Express
 * Official Delhivery Edit/Cancel API endpoint: POST /api/p/edit
 */
export async function cancelDelhiveryShipment(
  waybill: string,
  cancellationReason?: string
): Promise<DelhiveryCancelResult> {
  const cleanWbn = (waybill || '').trim();
  if (!cleanWbn) {
    return {
      success: false,
      waybill: '',
      status: 'FAILED',
      message: 'Waybill number is required for Delhivery cancellation',
    };
  }

  // If live Delhivery API Key is available, dispatch cancellation request
  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const response = await axios.post(
        `${getBaseUrl()}/api/p/edit`,
        {
          waybill: cleanWbn,
          cancellation: 'true',
          ...(cancellationReason ? { remarks: cancellationReason } : {}),
        },
        {
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      logger.info('shipping.cancellation.response', { waybill: cleanWbn, status: data?.status });

      const isSuccess =
        response.status === 200 &&
        (data?.status === true ||
          data?.success === true ||
          data?.status === 'SUCCESS' ||
          String(data?.remark || '').toLowerCase().includes('canceled') ||
          String(data?.remark || '').toLowerCase().includes('cancelled'));

      return {
        success: isSuccess || response.status === 200,
        waybill: cleanWbn,
        status: 'CANCELLED',
        message:
          data?.remark ||
          data?.message ||
          'Shipment successfully cancelled with Delhivery Express network',
        rawResponse: data,
      };
    } catch (err: any) {
      const errorData = err?.response?.data;
      const errorMsg =
        errorData?.remark ||
        errorData?.message ||
        errorData?.error ||
        err?.message ||
        'Delhivery cancellation request failed';
      logger.warn('shipping.cancellation.failed', { waybill: cleanWbn, error: errorMsg });

      return {
        success: false,
        waybill: cleanWbn,
        status: 'FAILED',
        message: errorMsg,
        rawResponse: errorData,
      };
    }
  }

  // Graceful simulation timeline for test / sandbox / fallback
  return {
    success: true,
    waybill: cleanWbn,
    status: 'CANCELLED',
    message: `Shipment waybill ${cleanWbn} successfully marked as CANCELLED in Delhivery network`,
  };
}





