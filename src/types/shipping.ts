/**
 * Neutral Shipping & Fulfillment Data Models
 * Safe for consumption by both Server and Client components.
 */

export interface ShippingAddressInput {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface DelhiveryPackageItem {
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  productName?: string;
}

export interface DelhiveryShipmentOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string | ShippingAddressInput;
  total: number;
  totalAmount?: number;
  shippingFee?: number;
  codBalanceAmount?: number;
  paymentMethod: 'COD' | 'Prepaid';
  items: DelhiveryPackageItem[];
  customerAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface DelhiveryShipmentResult {
  success: boolean;
  waybill?: string;
  trackingUrl?: string;
  uploadWbn?: string;
  message?: string;
  status?: string;
}
