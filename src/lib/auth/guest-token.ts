import crypto from 'crypto';

const GUEST_SECRET = process.env.BETTER_AUTH_SECRET || 'herbic-cure-guest-hmac-secret-salt-2026';

export function generateGuestAccessToken(orderId: string, orderNumber: string): string {
  const payload = `${orderId}:${orderNumber}`;
  const hmac = crypto.createHmac('sha256', GUEST_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${hmac}`;
}

export function verifyGuestAccessToken(token: string): { orderId: string; orderNumber: string } | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', GUEST_SECRET).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedHmac, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const [orderId, orderNumber] = payload.split(':');
    return { orderId, orderNumber };
  } catch {
    return null;
  }
}
