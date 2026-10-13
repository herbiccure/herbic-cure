import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../src/lib/auth/password-policy';

describe('Password Policy & True Entropy Tests', () => {
  it('rejects passwords shorter than 10 characters', async () => {
    const res = await validatePasswordStrength('Short1!');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('at least 10 characters');
  });

  it('rejects trivial guessable passwords despite length', async () => {
    const res = await validatePasswordStrength('password12345');
    expect(res.isValid).toBe(false);
    expect(res.score).toBeLessThan(2);
  });

  it('accepts complex passphrases with sufficient entropy', async () => {
    const res = await validatePasswordStrength('BrahmiNeemAmlaHerbalTherapy2026#');
    expect(res.isValid).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(2);
  });
});
