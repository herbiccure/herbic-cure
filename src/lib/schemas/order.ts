import { z } from 'zod';

export const orderUpdateSchema = z.object({
  orderStatus: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
  trackingNumber: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  eventDescription: z.string().optional().nullable(),
});

export type OrderUpdateValues = z.infer<typeof orderUpdateSchema>;
