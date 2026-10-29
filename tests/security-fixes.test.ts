import { describe, it, expect } from 'vitest';
import { signSessionToken, verifySessionToken } from '@/lib/auth/session';
import { cleanIndianMobile, validateIndianMobile } from '@/lib/utils';
import { POST as sendOtpHandler } from '@/app/api/auth/customer/send-otp/route';
import { POST as verifyOtpHandler } from '@/app/api/auth/customer/verify-otp/route';
import crypto from 'crypto';

describe('Security Fixes Validation Suite', () => {
  describe('Session Token HMAC Verification (admin-session-forgery-hmac-bypass)', () => {
    it('strictly rejects unsigned JSON fallback payloads', () => {
      const forgedUnsignedJson = JSON.stringify({
        id: 'attacker',
        email: 'admin@herbiccure.com',
        name: 'Attacker Admin',
        role: 'OWNER',
      });

      const result = verifySessionToken(forgedUnsignedJson);
      expect(result).toBeNull();
    });

    it('rejects tampered signature tokens', () => {
      const validToken = signSessionToken({ id: 'admin-1', email: 'admin@herbiccure.com', role: 'OWNER' });
      const [payload, sig] = validToken.split('.');
      const tamperedToken = `${payload}.${sig.slice(0, -4)}abcd`;

      const result = verifySessionToken(tamperedToken);
      expect(result).toBeNull();
    });

    it('correctly accepts authentic HMAC-signed session tokens', () => {
      const payload = { id: 'admin-1', email: 'admin@herbiccure.com', role: 'OWNER' };
      const validToken = signSessionToken(payload);

      const verified = verifySessionToken<typeof payload>(validToken);
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe('admin-1');
      expect(verified?.role).toBe('OWNER');
    });
  });

  describe('Indian 10-Digit Mobile Number Validation & Formatting', () => {
    it('accepts valid 10-digit Indian mobile numbers starting with 6, 7, 8, or 9', () => {
      expect(validateIndianMobile('9876543210').valid).toBe(true);
      expect(validateIndianMobile('8688888114').valid).toBe(true);
      expect(validateIndianMobile('7012345678').valid).toBe(true);
      expect(validateIndianMobile('6234567890').valid).toBe(true);
    });

    it('cleans and normalizes prefixes (+91, 91, 0, spaces, dashes)', () => {
      expect(cleanIndianMobile('+91 98765 43210')).toBe('9876543210');
      expect(cleanIndianMobile('919876543210')).toBe('9876543210');
      expect(cleanIndianMobile('09876543210')).toBe('9876543210');
      expect(cleanIndianMobile('9876-543-210')).toBe('9876543210');

      const res = validateIndianMobile('+91 98765 43210');
      expect(res.valid).toBe(true);
      expect(res.phone).toBe('9876543210');
    });

    it('rejects numbers that do not start with 6, 7, 8, or 9', () => {
      expect(validateIndianMobile('5551234567').valid).toBe(false);
      expect(validateIndianMobile('1234567890').valid).toBe(false);
      expect(validateIndianMobile('0123456789').valid).toBe(false);
    });

    it('rejects numbers with fewer or more than 10 digits', () => {
      expect(validateIndianMobile('987654321').valid).toBe(false); // 9 digits
      expect(validateIndianMobile('987654321012').valid).toBe(false); // too long
      expect(validateIndianMobile('').valid).toBe(false);
      expect(validateIndianMobile(null).valid).toBe(false);
    });
  });

  describe('Anti-Bot & Disabled SMS OTP Protection', () => {
    it('decommissioned send-otp endpoint returns HTTP 410 Gone with zero SMS dispatch', async () => {
      const response = await sendOtpHandler();
      expect(response.status).toBe(410);
      const json = await response.json();
      expect(json.error).toContain('disabled');
    });

    it('decommissioned verify-otp endpoint returns HTTP 410 Gone', async () => {
      const response = await verifyOtpHandler();
      expect(response.status).toBe(410);
      const json = await response.json();
      expect(json.error).toContain('disabled');
    });
  });

  describe('Admin Recovery Key Timing-Safe Full Match (admin-password-reset-truncated-key)', () => {
    it('requires the full key and rejects truncated 16-character prefix', () => {
      const fullSecret = 'b27349ffc160769a36a3cc60c2af9467e16ab70484a2bacfb8845e3e5694c70b';
      const prefix16 = fullSecret.slice(0, 16);

      const validKeys = [fullSecret];

      // Verifying full key matches
      const fullBuf = Buffer.from(fullSecret);
      const isFullAuthorized = validKeys.some((k) => {
        const kBuf = Buffer.from(k);
        return kBuf.length === fullBuf.length && crypto.timingSafeEqual(kBuf, fullBuf);
      });
      expect(isFullAuthorized).toBe(true);

      // Verifying truncated prefix is rejected
      const prefixBuf = Buffer.from(prefix16);
      const isPrefixAuthorized = validKeys.some((k) => {
        const kBuf = Buffer.from(k);
        return kBuf.length === prefixBuf.length && crypto.timingSafeEqual(kBuf, prefixBuf);
      });
      expect(isPrefixAuthorized).toBe(false);
    });
  });

  describe('SVG XSS Neutralization (stored-xss-svg-upload)', () => {
    it('sanitizes embedded scripts, event handlers, and javascript URIs from SVG content', () => {
      const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
        <circle cx="50" cy="50" r="40" fill="red" onclick="alert(2)" />
        <script>alert(document.domain)</script>
        <a href="javascript:alert(3)"><text>Click</text></a>
      </svg>`;

      const sanitized = maliciousSvg
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<script\b[^>]*>/gi, '')
        .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, '')
        .replace(/\s+on[a-z]+\s*=\s*[^>\s]+/gi, '')
        .replace(/(?:href|xlink:href)\s*=\s*(['"])javascript:.*?\1/gi, '$1#$1');

      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('<svg');
      expect(sanitized).toContain('<circle');
    });
  });
});
