import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';

const zxcvbn = new ZxcvbnFactory({
  dictionary: zxcvbnCommonPackage.dictionary,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
});

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  error?: string;
  isBreached?: boolean;
}

/**
 * Validates password strength without composition theatrics:
 * - Minimum 10 characters
 * - True entropy score >= 2 (out of 4) via zxcvbn
 * - k-Anonymity breach verification via HaveIBeenPwned
 */
export async function validatePasswordStrength(password: string): Promise<PasswordValidationResult> {
  if (!password || password.length < 10) {
    return {
      isValid: false,
      score: 0,
      error: 'Password must be at least 10 characters long.',
    };
  }

  const result = zxcvbn.check(password);
  if (result.score < 2) {
    return {
      isValid: false,
      score: result.score,
      error: 'This password is too easily guessable. Please choose a more complex passphrase.',
    };
  }

  // Check HaveIBeenPwned k-anonymity API (first 5 SHA-1 hex chars sent)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s max timeout

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      headers: { 'Add-Padding': 'true' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const [hashSuffix, count] = line.trim().split(':');
        if (hashSuffix === suffix && parseInt(count, 10) > 0) {
          return {
            isValid: false,
            score: result.score,
            isBreached: true,
            error: 'This password has appeared in known data breaches. Please select a unique password.',
          };
        }
      }
    }
  } catch {
    // If HIBP network is unavailable or times out, fail open on breach check
  }

  return {
    isValid: true,
    score: result.score,
  };
}
