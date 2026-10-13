import { z } from 'zod';

export const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  discountValue: z.coerce.number().positive('Discount value must be greater than 0'),
  minOrderValue: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  creatorName: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export type CouponFormValues = z.infer<typeof couponSchema>;
