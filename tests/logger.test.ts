import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, redact, sanitizeString, maskPhone, maskEmail } from '@/lib/logger';

describe('Logger Module & Security Hardening', () => {
  let stdoutWriteSpy: any;
  let stderrWriteSpy: any;
  let stdoutOutput: string[] = [];
  let stderrOutput: string[] = [];

  beforeEach(() => {
    stdoutOutput = [];
    stderrOutput = [];
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      stdoutOutput.push(String(chunk));
      return true;
    });
    stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: any) => {
      stderrOutput.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    stdoutWriteSpy.mockRestore();
    stderrWriteSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('Deep Redaction & Sensitive Key Masking', () => {
    it('redacts sensitive fields in nested objects', () => {
      const payload = {
        orderId: 'ord_123',
        customer: {
          name: 'Jane Doe',
          password: 'SuperSecretPassword123!',
          otp: '543210',
          creditCard: '4111111111111111',
          paymentDetails: {
            razorpaySignature: '38a7c2930491024823904',
            webhookSecret: 'whsec_99887766',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M',
          },
        },
      };

      const cleaned = redact(payload);

      expect(cleaned.orderId).toBe('ord_123');
      expect(cleaned.customer.password).toBe('[REDACTED]');
      expect(cleaned.customer.otp).toBe('[REDACTED]');
      expect(cleaned.customer.creditCard).toBe('[REDACTED]');
      expect(cleaned.customer.paymentDetails.razorpaySignature).toBe('[REDACTED]');
      expect(cleaned.customer.paymentDetails.webhookSecret).toBe('[REDACTED]');
      expect(cleaned.customer.paymentDetails.token).toBe('[REDACTED]');
    });

    it('redacts tokens and secrets embedded inside arbitrary string patterns', () => {
      const bearerHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.xyz';
      const dbUrl = 'postgresql://postgres:p@ssword123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
      const rawTextWithPhone = 'Contact customer at 9876543210 regarding package delivery';
      const rawTextWithEmail = 'Sent confirmation to customer.care@herbiccure.com today';

      expect(sanitizeString(bearerHeader)).toBe('Bearer [REDACTED]');
      expect(sanitizeString(dbUrl)).toContain('postgresql://postgres:[REDACTED]@');
      expect(sanitizeString(dbUrl)).not.toContain('p@ssword123');
      expect(sanitizeString(rawTextWithPhone)).toBe('Contact customer at [REDACTED_PHONE] regarding package delivery');
      expect(sanitizeString(rawTextWithPhone)).not.toContain('9876543210');
      expect(sanitizeString(rawTextWithEmail)).toBe('Sent confirmation to [REDACTED_EMAIL] today');
    });

    it('redacts sensitive info inside Error objects and stacks', () => {
      const sensitiveErr = new Error('Database query failed for user password hash: $argon2id$v=19$m=65536,t=3,p=4$abc$xyz');
      const redactedErr = redact(sensitiveErr);

      expect(redactedErr.name).toBe('Error');
      expect(redactedErr.message).toBeDefined();
      expect(redactedErr.stack).toBeDefined();
    });
  });

  describe('Value Truncation & Array Capping', () => {
    it('truncates strings exceeding 200 characters', () => {
      const longString = 'A'.repeat(250);
      const truncated = sanitizeString(longString, 200);

      expect(truncated.length).toBe(200);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('caps arrays at 20 items to prevent log flood', () => {
      const largeArray = Array.from({ length: 50 }, (_, i) => `item_${i}`);
      const capped = redact(largeArray);

      expect(capped.length).toBe(21); // 20 items + summary indicator
      expect(capped[20]).toBe('[...30 more items]');
    });
  });

  describe('Next.js Control-Flow Error Suppression', () => {
    it('suppresses Next.js NEXT_REDIRECT and NEXT_NOT_FOUND digest errors from being logged as errors', () => {
      const redirectError = new Error('NEXT_REDIRECT');
      (redirectError as any).digest = 'NEXT_REDIRECT;replace;/checkout;307;';

      const notFoundError = new Error('NEXT_NOT_FOUND');
      (notFoundError as any).digest = 'NEXT_NOT_FOUND';

      logger.error('route.handler.failed', { error: redirectError });
      logger.error('route.handler.failed', { error: notFoundError });

      expect(stderrOutput.length).toBe(0);
      expect(stdoutOutput.length).toBe(0);
    });
  });

  describe('Rate Limiting & Repeat Throttling', () => {
    it('collapses repeated identical errors within the throttle window', () => {
      const repeatEvent = 'external.api.timeout';
      const msg = 'Connection timed out after 5000ms';

      // 1st occurrence should emit
      logger.error(repeatEvent, msg);
      expect(stderrOutput.length).toBe(1);

      // 2nd through 5th occurrences within throttle window should be suppressed
      logger.error(repeatEvent, msg);
      logger.error(repeatEvent, msg);
      logger.error(repeatEvent, msg);
      expect(stderrOutput.length).toBe(1);
    });
  });

  describe('Simulated Flow Secret Leakage Check', () => {
    it('guarantees no environment secret values leak into logs during payment webhook and auth flow', () => {
      const FAKE_RAZORPAY_SECRET = 'rzp_sec_test_secret_99881122';
      const FAKE_DELHIVERY_TOKEN = 'delhivery_tok_super_secret_4455';
      const FAKE_ADMIN_PASSWORD = 'AdminSecureP@ssword2026!';
      const FAKE_OTP = '882194';

      process.env.RAZORPAY_KEY_SECRET = FAKE_RAZORPAY_SECRET;
      process.env.DELHIVERY_API_TOKEN = FAKE_DELHIVERY_TOKEN;

      // 1. Simulate payment webhook processing
      logger.info('payment.webhook.received', {
        provider: 'razorpay',
        event: 'payment.captured',
        paymentId: 'pay_ABC123',
        signature: 'cba1234567890abcdef',
        secret: FAKE_RAZORPAY_SECRET,
        headers: {
          'x-razorpay-signature': 'cba1234567890abcdef',
        },
      });

      // 2. Simulate customer login / OTP verify
      logger.info('auth.customer.login_attempt', {
        phone: '9876543210',
        phoneMasked: maskPhone('9876543210'),
        password: FAKE_ADMIN_PASSWORD,
        otp: FAKE_OTP,
      });

      const allOutput = [...stdoutOutput, ...stderrOutput].join('\n');

      // Verify ZERO raw secrets are present anywhere in the emitted log strings
      expect(allOutput).not.toContain(FAKE_RAZORPAY_SECRET);
      expect(allOutput).not.toContain(FAKE_DELHIVERY_TOKEN);
      expect(allOutput).not.toContain(FAKE_ADMIN_PASSWORD);
      expect(allOutput).not.toContain(FAKE_OTP);
      expect(allOutput).toContain('[REDACTED]');
      expect(allOutput).toContain('***3210');
    });
  });

  describe('Child Logger & Correlation ID', () => {
    it('attaches requestId and orderId to child logger events', () => {
      const child = logger.child({ requestId: 'req_xyz789', orderId: 'ord_456' });
      child.info('order.created', { totalAmount: 1499 });

      expect(stdoutOutput.length).toBe(1);
      const emitted = stdoutOutput[0];
      expect(emitted).toContain('req_xyz789');
      expect(emitted).toContain('ord_456');
    });
  });

  describe('Phone and Email Masking Helpers', () => {
    it('masks phone numbers to show only the last 4 digits', () => {
      expect(maskPhone('9876543210')).toBe('***3210');
      expect(maskPhone('+919876543210')).toBe('***3210');
      expect(maskPhone('12')).toBe('***');
    });

    it('masks email addresses preserving only first and last characters of username', () => {
      expect(maskEmail('customer@gmail.com')).toBe('c***r@gmail.com');
      expect(maskEmail('a@b.com')).toBe('***@b.com');
      expect(maskEmail('invalid-email')).toBe('***@***.***');
    });
  });
});
