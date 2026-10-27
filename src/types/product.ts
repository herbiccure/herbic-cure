/**
 * Neutral Product & Catalog Data Models
 * Safe for consumption by both Server and Client components.
 */

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string | null;
  displayOrder: number;
  isThumbnail: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  displayOrder: number;
  active: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  displayOrder: number;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  images?: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string | Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  regularPrice: number;
  salePrice?: number | null;
  costPrice?: number | null;
  tax?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isOnSale: boolean;
  hasTimer: boolean;
  active: boolean;
  displayOrder: number;
  rating: number;
  reviewCount: number;
  benefits?: string | null;
  howToUse?: string | null;
  faqJson?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  images?: ProductImage[];
  reviews?: Review[];
  createdAt: string | Date;
  updatedAt: string | Date;
}
