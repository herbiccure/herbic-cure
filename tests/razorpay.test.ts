import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '@/lib/payment/razorpay';

describe('Razorpay Payment Security & Signature Verification', () => {
  const TEST_KEY_SECRET = 'test_razorpay_secret_1234567890';
  const TEST_WEBHOOK_SECRET = 'test_webhook_secret_abcdefghijk';

  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  });

  describe('Payment Callback Signature Verification', () => {
    it('successfully verifies a genuine Razorpay payment signature', () => {
      const orderId = 'order_DA28Y3d98Zhd2A';
      const paymentId = 'pay_29QQoUBi66xm2f';
      const payload = `${orderId}|${paymentId}`;

      const validSignature = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const result = verifyRazorpayPaymentSignature({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });

      expect(result).toBe(true);
    });

    it('rejects a tampered or forged payment signature', () => {
      const result = verifyRazorpayPaymentSignature({
        razorpay_order_id: 'order_DA28Y3d98Zhd2A',
        razorpay_payment_id: 'pay_29QQoUBi66xm2f',
        razorpay_signature: 'invalid_forged_hex_signature_abcdef1234567890',
      });

      expect(result).toBe(false);
    });

    it('handles differing signature buffer lengths safely without throwing RangeError', () => {
      const result = verifyRazorpayPaymentSignature({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_456',
        razorpay_signature: 'short',
      });

      expect(result).toBe(false);
    });

    it('rejects when order ID or payment ID is missing', () => {
      expect(
        verifyRazorpayPaymentSignature({
          razorpay_order_id: '',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'sig',
        })
      ).toBe(false);
    });
  });

  describe('Webhook HMAC-SHA256 Signature Verification', () => {
    it('verifies a genuine Razorpay webhook event payload', () => {
      const rawBody = JSON.stringify({
        event: 'order.paid',
        payload: {
          payment: { entity: { id: 'pay_123', amount: 34900, status: 'captured' } },
        },
      });

      const validWebhookSig = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const isValid = verifyRazorpayWebhookSignature(rawBody, validWebhookSig);
      expect(isValid).toBe(true);
    });

    it('rejects a webhook event with a tampered body or forged signature', () => {
      const rawBody = JSON.stringify({ event: 'order.paid' });
      const isValid = verifyRazorpayWebhookSignature(rawBody, 'forged_hex_signature');
      expect(isValid).toBe(false);
    });

    it('rejects empty payloads or missing signatures safely', () => {
      expect(verifyRazorpayWebhookSignature('', 'some_sig')).toBe(false);
      expect(verifyRazorpayWebhookSignature('{"event":"test"}', '')).toBe(false);
    });
  });
});
