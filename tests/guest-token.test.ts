import { describe, it, expect } from 'vitest';
import { generateGuestAccessToken, verifyGuestAccessToken } from '../src/lib/auth/guest-token';

describe('Signed Guest Access Token HMAC Tests', () => {
  const orderId = 'ord-12345-uuid';
  const orderNumber = 'HC-10042';

  it('generates and verifies a valid signed guest token', () => {
    const token = generateGuestAccessToken(orderId, orderNumber);
    expect(typeof token).toBe('string');
    expect(token).toContain('.');

    const verified = verifyGuestAccessToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.orderId).toBe(orderId);
    expect(verified?.orderNumber).toBe(orderNumber);
  });

  it('rejects tampered tokens with invalid signature', () => {
    const token = generateGuestAccessToken(orderId, orderNumber);
    const [b64] = token.split('.');
    const tampered = `${b64}.0000000000000000000000000000000000000000000000000000000000000000`;

    expect(verifyGuestAccessToken(tampered)).toBeNull();
  });

  it('rejects malformed token strings', () => {
    expect(verifyGuestAccessToken('')).toBeNull();
    expect(verifyGuestAccessToken('not-a-token')).toBeNull();
    expect(verifyGuestAccessToken('invalid.token.structure')).toBeNull();
  });
});
