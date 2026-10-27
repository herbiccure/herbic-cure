/**
 * Neutral Cart Data Models
 * Safe for consumption by both Server and Client components.
 */

export interface CartItem {
  id: string; // product id
  name: string;
  slug: string;
  price: number;
  regularPrice?: number;
  image: string;
  quantity: number;
}

export interface CodAdvanceSettings {
  enabled: boolean;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  maxCap?: number | null;
  message: string;
}

export interface AppliedCoupon {
  code: string;
  discountValue: number;
  discountType: string;
}
