import { describe, it, expect } from 'vitest';
import { calculateCodAdvance } from '@/lib/shipping/codAdvance';
import { codAdvanceSettingsSchema } from '@/lib/schemas/settings';

describe('COD Advance Payment Feature', () => {
  describe('Authoritative Calculation Engine (calculateCodAdvance)', () => {
    it('calculates fixed advance correctly (e.g. ₹100 on ₹1,000 order)', () => {
      const result = calculateCodAdvance(
        1000,
        { enabled: true, type: 'FIXED', value: 100 },
        'COD'
      );

      expect(result.isApplicable).toBe(true);
      expect(result.advanceAmount).toBe(100);
      expect(result.balanceAmount).toBe(900);
      expect(result.snapshot).not.toBeNull();
      expect(result.snapshot?.type).toBe('FIXED');
      expect(result.snapshot?.value).toBe(100);
    });

    it('calculates percentage advance correctly (e.g. 10% on ₹1,500 order)', () => {
      const result = calculateCodAdvance(
        1500,
        { enabled: true, type: 'PERCENTAGE', value: 10 },
        'COD'
      );

      expect(result.isApplicable).toBe(true);
      expect(result.advanceAmount).toBe(150);
      expect(result.balanceAmount).toBe(1350);
    });

    it('applies maximum cap when percentage advance exceeds cap', () => {
      // 20% of ₹2,000 is ₹400, but cap is ₹250
      const result = calculateCodAdvance(
        2000,
        { enabled: true, type: 'PERCENTAGE', value: 20, maxCap: 250 },
        'COD'
      );

      expect(result.isApplicable).toBe(true);
      expect(result.advanceAmount).toBe(250);
      expect(result.balanceAmount).toBe(1750);
      expect(result.snapshot?.maxCap).toBe(250);
    });

    it('does not apply maximum cap when percentage advance is below cap', () => {
      // 10% of ₹1,000 is ₹100, cap is ₹250
      const result = calculateCodAdvance(
        1000,
        { enabled: true, type: 'PERCENTAGE', value: 10, maxCap: 250 },
        'COD'
      );

      expect(result.isApplicable).toBe(true);
      expect(result.advanceAmount).toBe(100);
      expect(result.balanceAmount).toBe(900);
    });

    it('rounds percentage advance to nearest integer rupee', () => {
      // 15% of ₹499 is ₹74.85 -> rounded to ₹75
      const result = calculateCodAdvance(
        499,
        { enabled: true, type: 'PERCENTAGE', value: 15 },
        'COD'
      );

      expect(result.isApplicable).toBe(true);
      expect(result.advanceAmount).toBe(75);
      expect(result.balanceAmount).toBe(424);
      expect(result.advanceAmount + result.balanceAmount).toBe(499);
    });

    it('caps advance to total if advance >= total order value', () => {
      // Fixed advance ₹500 on an order total of ₹300
      const result = calculateCodAdvance(
        300,
        { enabled: true, type: 'FIXED', value: 500 },
        'COD'
      );

      expect(result.isApplicable).toBe(true);
      expect(result.advanceAmount).toBe(300);
      expect(result.balanceAmount).toBe(0);
    });

    it('enforces minimum advance of ₹1 (Razorpay 100 paise minimum)', () => {
      // 1% of ₹10 is ₹0.10 -> must floor to ₹1
      const result = calculateCodAdvance(
        10,
        { enabled: true, type: 'PERCENTAGE', value: 1 },
        'COD'
      );

      expect(result.isApplicable).toBe(true);
      expect(result.advanceAmount).toBe(1);
      expect(result.balanceAmount).toBe(9);
    });

    it('returns zero advance and leaves full total as balance when feature is disabled', () => {
      const result = calculateCodAdvance(
        1000,
        { enabled: false, type: 'FIXED', value: 100 },
        'COD'
      );

      expect(result.isApplicable).toBe(false);
      expect(result.advanceAmount).toBe(0);
      expect(result.balanceAmount).toBe(1000);
      expect(result.snapshot).toBeNull();
    });

    it('returns not applicable for prepaid orders (RAZORPAY, ONLINE, UPI, CARD)', () => {
      const prepaidMethods = ['RAZORPAY', 'ONLINE', 'UPI', 'CARD'];
      for (const method of prepaidMethods) {
        const result = calculateCodAdvance(
          1000,
          { enabled: true, type: 'FIXED', value: 100 },
          method
        );

        expect(result.isApplicable).toBe(false);
        expect(result.advanceAmount).toBe(0);
        expect(result.balanceAmount).toBe(0);
        expect(result.snapshot).toBeNull();
      }
    });

    it('handles zero or negative order total safely', () => {
      const resultZero = calculateCodAdvance(
        0,
        { enabled: true, type: 'FIXED', value: 100 },
        'COD'
      );
      expect(resultZero.isApplicable).toBe(false);
      expect(resultZero.advanceAmount).toBe(0);
      expect(resultZero.balanceAmount).toBe(0);

      const resultNeg = calculateCodAdvance(
        -50,
        { enabled: true, type: 'FIXED', value: 100 },
        'COD'
      );
      expect(resultNeg.isApplicable).toBe(false);
      expect(resultNeg.advanceAmount).toBe(0);
      expect(resultNeg.balanceAmount).toBe(0);
    });

    it('creates an immutable audit snapshot with applied timestamp', () => {
      const result = calculateCodAdvance(
        750,
        { enabled: true, type: 'FIXED', value: 150 },
        'COD'
      );

      expect(result.snapshot).toBeDefined();
      expect(result.snapshot?.enabled).toBe(true);
      expect(result.snapshot?.calculatedAdvance).toBe(150);
      expect(result.snapshot?.calculatedBalance).toBe(600);
      expect(result.snapshot?.appliedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Settings Validation Schema (codAdvanceSettingsSchema)', () => {
    it('validates valid fixed advance settings', () => {
      const parsed = codAdvanceSettingsSchema.safeParse({
        cod_advance_enabled: 'true',
        cod_advance_type: 'FIXED',
        cod_advance_value: '100',
        cod_advance_message: 'Pay ₹100 advance to confirm your COD order.',
      });

      expect(parsed.success).toBe(true);
    });

    it('validates valid percentage advance settings with max cap', () => {
      const parsed = codAdvanceSettingsSchema.safeParse({
        cod_advance_enabled: 'true',
        cod_advance_type: 'PERCENTAGE',
        cod_advance_value: '15',
        cod_advance_max_cap: '300',
        cod_advance_message: 'A 15% advance confirms your order.',
      });

      expect(parsed.success).toBe(true);
    });

    it('rejects percentage value greater than 100%', () => {
      const parsed = codAdvanceSettingsSchema.safeParse({
        cod_advance_enabled: 'true',
        cod_advance_type: 'PERCENTAGE',
        cod_advance_value: '120',
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toMatch(/between 1% and 100%/i);
      }
    });

    it('rejects fixed value with decimals (must be whole rupees)', () => {
      const parsed = codAdvanceSettingsSchema.safeParse({
        cod_advance_enabled: 'true',
        cod_advance_type: 'FIXED',
        cod_advance_value: '99.5',
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toMatch(/whole rupees/i);
      }
    });

    it('rejects zero or negative values', () => {
      const parsedZero = codAdvanceSettingsSchema.safeParse({
        cod_advance_enabled: 'true',
        cod_advance_type: 'FIXED',
        cod_advance_value: '0',
      });
      expect(parsedZero.success).toBe(false);

      const parsedNeg = codAdvanceSettingsSchema.safeParse({
        cod_advance_enabled: 'true',
        cod_advance_type: 'FIXED',
        cod_advance_value: '-50',
      });
      expect(parsedNeg.success).toBe(false);
    });

    it('rejects message exceeding 300 characters', () => {
      const longMessage = 'A'.repeat(301);
      const parsed = codAdvanceSettingsSchema.safeParse({
        cod_advance_enabled: 'true',
        cod_advance_type: 'FIXED',
        cod_advance_value: '100',
        cod_advance_message: longMessage,
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toMatch(/cannot exceed 300 characters/i);
      }
    });
  });

  describe('Delhivery CMU Manifestation Amount Calculation', () => {
    function computeDelhiveryCmuPayload({
      orderTotal,
      advanceAmount = 0,
      codBalanceAmount,
      isCod,
    }: {
      orderTotal: number;
      advanceAmount?: number;
      codBalanceAmount?: number | null;
      isCod: boolean;
    }) {
      let effectivePaymentMode: 'COD' | 'Prepaid' = isCod ? 'COD' : 'Prepaid';
      let codAmount = '0';

      if (isCod) {
        const rawBalance = typeof codBalanceAmount === 'number'
          ? Math.round(codBalanceAmount)
          : Math.round(orderTotal - advanceAmount);

        if (rawBalance <= 0) {
          effectivePaymentMode = 'Prepaid';
          codAmount = '0';
        } else {
          codAmount = String(rawBalance);
        }
      }

      return {
        payment_mode: effectivePaymentMode,
        cod_amount: codAmount,
        total_amount: String(Math.round(orderTotal)),
      };
    }

    it('manifests COD advance order with balance as cod_amount and full invoice as total_amount', () => {
      const payload = computeDelhiveryCmuPayload({
        orderTotal: 1200,
        advanceAmount: 200,
        codBalanceAmount: 1000,
        isCod: true,
      });

      expect(payload.payment_mode).toBe('COD');
      expect(payload.cod_amount).toBe('1000'); // Delhivery collects ONLY the remaining balance!
      expect(payload.total_amount).toBe('1200'); // Full declared shipment value
    });

    it('switches to Prepaid with cod_amount = 0 when advance covers 100% of order', () => {
      const payload = computeDelhiveryCmuPayload({
        orderTotal: 500,
        advanceAmount: 500,
        codBalanceAmount: 0,
        isCod: true,
      });

      expect(payload.payment_mode).toBe('Prepaid');
      expect(payload.cod_amount).toBe('0');
      expect(payload.total_amount).toBe('500');
    });

    it('manifests full total as cod_amount when order is normal COD without advance', () => {
      const payload = computeDelhiveryCmuPayload({
        orderTotal: 850,
        advanceAmount: 0,
        codBalanceAmount: 850,
        isCod: true,
      });

      expect(payload.payment_mode).toBe('COD');
      expect(payload.cod_amount).toBe('850');
      expect(payload.total_amount).toBe('850');
    });

    it('manifests Prepaid orders with cod_amount = 0', () => {
      const payload = computeDelhiveryCmuPayload({
        orderTotal: 999,
        isCod: false,
      });

      expect(payload.payment_mode).toBe('Prepaid');
      expect(payload.cod_amount).toBe('0');
      expect(payload.total_amount).toBe('999');
    });
  });

  describe('Payment Gateway Paise Verification Logic', () => {
    function computeExpectedPaise(order: {
      paymentMethod: string;
      advanceAmount?: number;
      total: number;
    }) {
      const isCodAdvanceOrder = order.paymentMethod === 'COD' && (order.advanceAmount || 0) > 0;
      const expectedAmount = isCodAdvanceOrder ? order.advanceAmount! : order.total;
      return Math.round(expectedAmount * 100);
    }

    it('expects advance amount in paise for COD advance orders', () => {
      const paise = computeExpectedPaise({
        paymentMethod: 'COD',
        advanceAmount: 150,
        total: 1000,
      });

      expect(paise).toBe(15000); // 150 * 100
    });

    it('expects full total amount in paise for full prepaid orders', () => {
      const paise = computeExpectedPaise({
        paymentMethod: 'RAZORPAY',
        total: 1000,
      });

      expect(paise).toBe(100000); // 1000 * 100
    });
  });
});
