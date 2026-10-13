import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  slug: z.string().min(2, 'Slug is required'),
  sku: z.string().optional().nullable(),
  regularPrice: z.coerce.number().positive('Regular price must be greater than 0'),
  salePrice: z.coerce.number().positive().optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0, 'Stock cannot be negative').default(50),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  categoryId: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
