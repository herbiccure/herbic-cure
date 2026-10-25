import { describe, it, expect } from 'vitest';

describe('Prepaid vs COD Shipping Calculation Logic', () => {
  const standardShippingFee = 89;
  const freeShippingThreshold = 499;

  function calculateShippingAndTotal({
    subtotal,
    discount = 0,
    paymentMethod,
  }: {
    subtotal: number;
    discount?: number;
    paymentMethod: 'COD' | 'RAZORPAY' | 'ONLINE' | 'UPI' | 'CARD';
  }) {
    const isPrepaid = paymentMethod !== 'COD';
    const isCodFreeShipping = subtotal >= freeShippingThreshold;
    const shippingFee = isPrepaid ? 0 : (isCodFreeShipping ? 0 : standardShippingFee);
    const finalTotal = Math.max(0, subtotal - discount + shippingFee);

    return { shippingFee, finalTotal };
  }

  it('guarantees 0 delivery charges for prepaid orders even when order is under ₹499', () => {
    const prepaidMethods: Array<'RAZORPAY' | 'ONLINE' | 'UPI' | 'CARD'> = [
      'RAZORPAY',
      'ONLINE',
      'UPI',
      'CARD',
    ];

    for (const method of prepaidMethods) {
      const result = calculateShippingAndTotal({
        subtotal: 299,
        paymentMethod: method,
      });

      expect(result.shippingFee).toBe(0);
      expect(result.finalTotal).toBe(299);
    }
  });

  it('guarantees 0 delivery charges for prepaid orders when order is over ₹499', () => {
    const result = calculateShippingAndTotal({
      subtotal: 699,
      paymentMethod: 'RAZORPAY',
    });

    expect(result.shippingFee).toBe(0);
    expect(result.finalTotal).toBe(699);
  });

  it('charges standard shipping fee (₹89) for COD orders under ₹499', () => {
    const result = calculateShippingAndTotal({
      subtotal: 299,
      paymentMethod: 'COD',
    });

    expect(result.shippingFee).toBe(89);
    expect(result.finalTotal).toBe(388);
  });

  it('provides free delivery for COD orders above ₹499', () => {
    const result = calculateShippingAndTotal({
      subtotal: 599,
      paymentMethod: 'COD',
    });

    expect(result.shippingFee).toBe(0);
    expect(result.finalTotal).toBe(599);
  });
});
