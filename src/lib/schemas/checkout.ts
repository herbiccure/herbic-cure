import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9'),
  email: z.string().trim().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().trim().min(5, 'Please enter complete delivery address'),
  city: z.string().trim().min(2, 'Please enter your city'),
  state: z.string().trim().min(2, 'Please enter your state'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit postal PIN code'),
  paymentMethod: z.enum(['COD', 'CASHFREE', 'ONLINE', 'UPI', 'CARD', 'RAZORPAY']).default('COD'),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

