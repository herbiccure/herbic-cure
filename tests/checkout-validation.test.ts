import { describe, it, expect } from 'vitest';
import { checkoutSchema } from '@/lib/schemas/checkout';

describe('Checkout Form Validation - Mobile Number & PIN Code', () => {
  const baseValidData = {
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya@example.com',
    address: '123 Heritage Lane, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    paymentMethod: 'COD' as const,
  };

  it('accepts valid 10-digit mobile numbers starting with 6, 7, 8, or 9', () => {
    const validPrefixes = ['9876543210', '8123456789', '7012345678', '6234567890'];
    for (const phone of validPrefixes) {
      const res = checkoutSchema.safeParse({ ...baseValidData, phone });
      expect(res.success).toBe(true);
    }
  });

  it('rejects mobile numbers with fewer than 10 digits', () => {
    const res = checkoutSchema.safeParse({ ...baseValidData, phone: '987654321' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toMatch(/valid 10-digit mobile number/i);
    }
  });

  it('rejects mobile numbers with more than 10 digits', () => {
    const res = checkoutSchema.safeParse({ ...baseValidData, phone: '98765432101' });
    expect(res.success).toBe(false);
  });

  it('rejects mobile numbers starting with 0, 1, 2, 3, 4, or 5', () => {
    const invalidPhones = ['0987654321', '1234567890', '5987654321'];
    for (const phone of invalidPhones) {
      const res = checkoutSchema.safeParse({ ...baseValidData, phone });
      expect(res.success).toBe(false);
    }
  });

  it('rejects phone numbers containing letters or special characters', () => {
    const res = checkoutSchema.safeParse({ ...baseValidData, phone: '987654321a' });
    expect(res.success).toBe(false);
  });

  it('strictly validates postal PIN code to exactly 6 digits', () => {
    expect(checkoutSchema.safeParse({ ...baseValidData, pincode: '500033' }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...baseValidData, pincode: '50003' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...baseValidData, pincode: '5000339' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...baseValidData, pincode: '50003a' }).success).toBe(false);
  });
});
