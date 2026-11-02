import { z } from 'zod';

export const orderUpdateSchema = z.object({
  orderStatus: z
    .enum([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'READY_TO_SHIP',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ])
    .optional(),
  trackingNumber: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  eventDescription: z.string().optional().nullable(),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  customerEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  customerPhone: z.string().trim().optional(),
  shippingAddress: z.string().optional(),
  address: z.string().trim().min(3, 'Address must be at least 3 characters').optional(),
  city: z.string().trim().min(2, 'City must be at least 2 characters').optional(),
  state: z.string().trim().min(2, 'State must be at least 2 characters').optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'PIN code must be a 6-digit number')
    .optional(),
  notes: z.string().optional().nullable(),
  shippingFee: z.number().min(0).optional().nullable(),
  codBalanceAmount: z.number().min(0).optional().nullable(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  action: z.enum(['accept', 'reject', 'update']).optional(),
  rejectionReason: z.string().optional().nullable(),
});

export type OrderUpdateValues = z.infer<typeof orderUpdateSchema>;
