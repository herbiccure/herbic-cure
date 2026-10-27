/**
 * Neutral Order & Fulfillment Data Models
 * Safe for consumption by both Server and Client components.
 * Contains ZERO database drivers or server-only dependencies.
 */

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'COD' | 'RAZORPAY';

export type ShippingMode = 'delhivery_pending' | 'auto_manifest';

export type DelhiverySyncStatus = 'PENDING_DISPATCH' | 'SYNCED' | 'FAILED';

export type DelhiveryStatus =
  | 'PENDING'
  | 'READY_TO_SHIP'
  | 'MANIFESTED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RTO';

export type PickupStatus = 'NONE' | 'REQUESTED' | 'SCHEDULED' | 'FAILED' | 'PICKED';

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string | null;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
  total: number;
}

export interface ShipmentEvent {
  id: string;
  orderId: string;
  status: string;
  location?: string | null;
  description: string;
  timestamp: string | Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guestAccessToken?: string | null;
  shippingAddress: string;
  billingAddress?: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
  notes?: string | null;
  advanceAmount: number;
  codBalanceAmount?: number | null;
  advancePaymentId?: string | null;
  advancePaidAt?: string | Date | null;
  advanceSettingsSnapshot?: string | null;
  shippingMode?: string | null;
  delhiverySyncStatus?: string | null;
  delhiverySyncAttempts?: number;
  delhiverySyncError?: string | null;
  lastDelhiverySyncAt?: string | Date | null;
  delhiveryStatus?: string | null;
  pickupStatus?: string;
  pickupRequestId?: string | null;
  pickupDate?: string | Date | null;
  pickupTime?: string | null;
  pickupError?: string | null;
  pickupAttempts?: number;
  lastPickupAttemptAt?: string | Date | null;
  version?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  items?: OrderItem[];
  events?: ShipmentEvent[];
}
