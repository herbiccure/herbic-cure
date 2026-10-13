import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().optional().nullable(),
  subject: z.string().optional().default('Customer Inquiry'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
