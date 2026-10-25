/**
 * Razorpay Payment Gateway Service
 * Official API Integration for Herbic Cure Online Checkout (UPI, Cards, NetBanking, Wallets)
 * Uses official Razorpay SDK & Webhook HMAC Verification
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { logger } from '@/lib/logger';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export interface CreateRazorpayOrderParams {
  orderNumber: string;
  amount: number; // in INR Rupees
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  success: boolean;
  orderId: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function getRazorpayConfig(): RazorpayConfig {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  return { keyId, keySecret, webhookSecret };
}

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  const { keyId, keySecret } = getRazorpayConfig();
  if (!keyId || !keySecret) {
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

/**
 * Creates an authoritative Razorpay Order on the Razorpay gateway.
 * The amount is converted to Indian paise (₹1 = 100 paise).
 */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams
): Promise<RazorpayOrderResult> {
  const { keyId, keySecret } = getRazorpayConfig();

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
    );
  }

  const client = getRazorpayClient();
  if (!client) {
    throw new Error('Failed to initialize Razorpay client.');
  }

  // Convert Rupees to Paise (e.g., ₹349 -> 34900 paise)
  const amountInPaise = Math.round(params.amount * 100);

  if (amountInPaise <= 0) {
    throw new Error('Order amount must be greater than zero.');
  }

  const cleanPhone = (params.customerPhone || '').replace(/\D/g, '').slice(-10);

  const orderOptions = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: params.orderNumber.slice(0, 40),
    notes: {
      orderNumber: params.orderNumber,
      customerName: params.customerName || 'Customer',
      customerPhone: cleanPhone,
      customerEmail: params.customerEmail || '',
      ...(params.notes || {}),
    },
  };

  const razorpayOrder = await client.orders.create(orderOptions);

  return {
    success: true,
    orderId: params.orderNumber,
    razorpayOrderId: razorpayOrder.id,
    amount: typeof razorpayOrder.amount === 'number' ? razorpayOrder.amount : amountInPaise,
    currency: razorpayOrder.currency || 'INR',
    keyId,
    notes: orderOptions.notes,
  };
}

/**
 * Cryptographically verifies the payment signature returned by the Razorpay Checkout Modal.
 * Formula: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secretKey)
 * Uses crypto.timingSafeEqual to prevent timing side-channel attacks.
 */
export function verifyRazorpayPaymentSignature(params: VerifyPaymentParams): boolean {
  const { keySecret } = getRazorpayConfig();

  if (!keySecret) {
    logger.error('payment.config.missing_secret');
    return false;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  try {
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(razorpay_signature, 'utf-8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err: any) {
    logger.warn('payment.signature.verification_error', { error: err?.message });
    return false;
  }
}

/**
 * Cryptographically verifies a Razorpay Webhook signature against the raw body.
 * Header: x-razorpay-signature
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const { webhookSecret, keySecret } = getRazorpayConfig();
  const secret = webhookSecret || keySecret;

  if (!secret) {
    logger.error('payment.webhook.missing_secret');
    return false;
  }

  if (!rawBody || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signature, 'utf-8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err: any) {
    logger.warn('payment.webhook.signature_error', { error: err?.message });
    return false;
  }
}

/**
 * Fetches authoritative payment details directly from Razorpay
 */
export async function fetchRazorpayPaymentDetails(paymentId: string) {
  const client = getRazorpayClient();
  if (!client) {
    throw new Error('Razorpay client not configured');
  }
  return client.payments.fetch(paymentId);
}
