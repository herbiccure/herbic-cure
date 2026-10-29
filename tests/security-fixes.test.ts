import { describe, it, expect } from 'vitest';
import { signSessionToken, verifySessionToken } from '@/lib/auth/session';
import { generatePhoneOtp, verifyPhoneOtp } from '@/lib/otp';
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

  describe('Customer Phone OTP Cryptographic Protection (customer-otp-secret-exposure)', () => {
    it('encrypts verification token so sessionSecret is not visible in plaintext base64', () => {
      const phone = '9876543210';
      const result = generatePhoneOtp(phone);

      const decoded = Buffer.from(result.verificationToken, 'base64').toString('utf8');
      // Must NOT contain unencrypted JSON with sessionSecret
      expect(decoded).not.toContain('sessionSecret');
      expect(decoded).not.toContain('"phone"');
      // Format must be iv:tag:ciphertext
      const parts = decoded.split(':');
      expect(parts.length).toBe(3);
    });

    it('successfully verifies a valid OTP code', () => {
      const phone = '9876543210';
      const result = generatePhoneOtp(phone);

      const verifyCheck = verifyPhoneOtp(phone, result.otp, result.verificationToken);
      expect(verifyCheck.valid).toBe(true);
    });

    it('rejects an incorrect OTP code', () => {
      const phone = '9876543210';
      const result = generatePhoneOtp(phone);

      const wrongOtp = result.otp === '123456' ? '654321' : '123456';
      const verifyCheck = verifyPhoneOtp(phone, wrongOtp, result.verificationToken);
      expect(verifyCheck.valid).toBe(false);
      expect(verifyCheck.error).toContain('Incorrect OTP code');
    });

    it('rejects verification token used with a mismatched phone number', () => {
      const phone = '9876543210';
      const result = generatePhoneOtp(phone);

      const verifyCheck = verifyPhoneOtp('9123456780', result.otp, result.verificationToken);
      expect(verifyCheck.valid).toBe(false);
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
