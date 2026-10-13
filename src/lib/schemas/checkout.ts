import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z.string().min(2, 'Please enter your full name'),
  phone: z.string().min(10, 'Please enter a valid 10-digit mobile number'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(5, 'Please enter complete delivery address'),
  city: z.string().min(2, 'Please enter your city'),
  state: z.string().min(2, 'Please enter your state'),
  pincode: z.string().min(6, 'Please enter a 6-digit postal PIN code'),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD']).default('COD'),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
