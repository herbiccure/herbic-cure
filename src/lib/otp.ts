import { authenticator } from 'otplib';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

// Configure authenticator options
// Step: 300 seconds (5 minutes validity)
// Window: 1 step window allowance for time drift
authenticator.options = {
  step: 300,
  window: 1,
  digits: 6,
};

const OTP_SECRET_KEY = process.env.OTP_SIGNING_SECRET || 'herbic_cure_secret_otp_signing_key_2026';

// In-memory rate limiting map: phone -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

/**
 * Check if the phone number has exceeded rate limits:
 * - Max 3 OTP requests per 10 minutes
 * - Min 30 seconds between consecutive requests
 */
export function checkOtpRateLimit(phone: string): { allowed: boolean; waitSeconds?: number; error?: string } {
  const isDev = process.env.NODE_ENV !== 'production';
  const now = Date.now();
  const history = rateLimitMap.get(phone) || [];

  // Filter requests within the last 10 minutes
  const recent = history.filter((ts) => now - ts < 10 * 60 * 1000);
  rateLimitMap.set(phone, recent);

  // In development, allow 5-second cooldown; in production, 30-second cooldown
  const cooldownMs = isDev ? 5 * 1000 : 30 * 1000;
  if (recent.length > 0) {
    const lastRequest = recent[recent.length - 1];
    const diff = now - lastRequest;
    if (diff < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - diff) / 1000);
      return {
        allowed: false,
        waitSeconds,
        error: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
      };
    }
  }

  // Max limit: 20 in dev, 5 in production per 10 minutes
  const maxAttempts = isDev ? 20 : 5;
  if (recent.length >= maxAttempts) {
    return {
      allowed: false,
      error: 'Too many OTP requests for this mobile number. Please try again after 10 minutes.',
    };
  }

  // Record this request
  recent.push(now);
  rateLimitMap.set(phone, recent);
  return { allowed: true };
}

export interface GeneratedOtpResult {
  otp: string;
  verificationToken: string;
  expiresIn: number;
}

/**
 * Generates a 6-digit OTP using otplib and returns a cryptographically signed verification token
 */
export function generatePhoneOtp(phone: string): GeneratedOtpResult {
  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  const sessionSecret = authenticator.generateSecret();
  const otp = authenticator.generate(sessionSecret);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  const payload = JSON.stringify({
    phone: normalizedPhone,
    sessionSecret,
    expiresAt,
    salt: crypto.randomBytes(8).toString('hex'),
  });

  const signature = crypto
    .createHmac('sha256', OTP_SECRET_KEY)
    .update(payload)
    .digest('hex');

  const verificationToken = Buffer.from(`${payload}::${signature}`).toString('base64');

  return {
    otp,
    verificationToken,
    expiresIn: 300,
  };
}

export interface VerifyOtpResult {
  valid: boolean;
  error?: string;
}

/**
 * Verifies a 6-digit OTP using otplib against the signed verification token
 */
export function verifyPhoneOtp(
  phone: string,
  userOtp: string,
  verificationToken: string
): VerifyOtpResult {
  if (!userOtp || !verificationToken || !phone) {
    return { valid: false, error: 'Mobile number, OTP, and verification token are required.' };
  }

  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  const cleanOtp = userOtp.trim().replace(/\s/g, '');

  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return { valid: false, error: 'Please enter a valid 6-digit OTP code.' };
  }

  try {
    const decoded = Buffer.from(verificationToken, 'base64').toString('utf-8');
    const [payloadStr, signature] = decoded.split('::');

    if (!payloadStr || !signature) {
      return { valid: false, error: 'Invalid or malformed verification token.' };
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', OTP_SECRET_KEY)
      .update(payloadStr)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature);
    const actualBuf = Buffer.from(signature);

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return { valid: false, error: 'Verification token signature mismatch or expired.' };
    }

    const { phone: tokenPhone, sessionSecret, expiresAt } = JSON.parse(payloadStr);

    if (tokenPhone !== normalizedPhone) {
      return { valid: false, error: 'Verification token does not match the provided phone number.' };
    }

    if (Date.now() > expiresAt) {
      return { valid: false, error: 'This OTP has expired. Please request a new verification code.' };
    }

    // Standard verification using otplib
    const isValid = authenticator.check(cleanOtp, sessionSecret);
    if (!isValid) {
      return { valid: false, error: 'Incorrect OTP code. Please check your SMS and try again.' };
    }

    return { valid: true };
  } catch (err: any) {
    logger.warn('auth.otp.verification_parse_error', { error: err?.message });
    return { valid: false, error: 'Failed to verify OTP code. Please try again.' };
  }
}
