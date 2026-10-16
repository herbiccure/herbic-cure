import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  email: z.string().trim().email('Please enter a valid email address'),
  address: z.string().trim().min(5, 'Delivery address must be at least 5 characters').max(300),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit PIN code'),
  paymentMethod: z.enum(['COD', 'CASHFREE', 'ONLINE', 'UPI', 'CARD', 'RAZORPAY']).default('COD'),
  items: z
    .array(
      z.object({
        id: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Max quantity per item is 50'),
        name: z.string().optional(),
        price: z.number().optional(),
        image: z.string().optional(),
      })
    )
    .min(1, 'Your order must contain at least one item'),
  couponCode: z.string().trim().max(50).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(2000),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional().or(z.literal('')),
  comment: z.string().trim().min(3, 'Review comment must be at least 3 characters').max(2000),
  userName: z.string().trim().min(2, 'Your name is required').max(100),
  userEmail: z.string().trim().email('Please enter a valid email address'),
});

export const couponVerifySchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required').max(50),
  subtotal: z.number().nonnegative().optional().default(0),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const adminOrderUpdateSchema = z.object({
  orderStatus: z
    .enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'])
    .optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  carrier: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

