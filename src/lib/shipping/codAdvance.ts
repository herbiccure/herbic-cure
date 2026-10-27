export interface CodAdvanceSettings {
  enabled: boolean;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  maxCap?: number | null;
}

export interface CodAdvanceCalculation {
  isApplicable: boolean;
  advanceAmount: number;
  balanceAmount: number;
  snapshot: {
    enabled: boolean;
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
    maxCap: number | null;
    calculatedAdvance: number;
    calculatedBalance: number;
    appliedAt: string;
  } | null;
}

/**
 * Pure calculation function for COD Advance.
 * Reusable on server (authoritative) and in tests.
 * Free of server-only imports so it can also be safely referenced in neutral shared contexts.
 */
export function calculateCodAdvance(
  total: number,
  settings: CodAdvanceSettings,
  paymentMethod: string
): CodAdvanceCalculation {
  if (paymentMethod !== 'COD' || !settings.enabled || total <= 0) {
    return {
      isApplicable: false,
      advanceAmount: 0,
      balanceAmount: paymentMethod === 'COD' ? Math.max(0, total) : 0,
      snapshot: null,
    };
  }

  const { type, value, maxCap } = settings;
  if (value <= 0) {
    return {
      isApplicable: false,
      advanceAmount: 0,
      balanceAmount: total,
      snapshot: null,
    };
  }

  let rawAdvance = 0;
  if (type === 'FIXED') {
    rawAdvance = Math.round(value);
  } else {
    rawAdvance = Math.round((total * value) / 100);
    if (typeof maxCap === 'number' && maxCap > 0 && rawAdvance > maxCap) {
      rawAdvance = Math.round(maxCap);
    }
  }

  // Ensure whole rupees and bounded between 1 (Razorpay minimum ₹1.00) and total
  const advanceAmount = Math.max(1, Math.min(rawAdvance, total));
  const balanceAmount = Math.max(0, total - advanceAmount);

  return {
    isApplicable: true,
    advanceAmount,
    balanceAmount,
    snapshot: {
      enabled: true,
      type,
      value,
      maxCap: typeof maxCap === 'number' ? maxCap : null,
      calculatedAdvance: advanceAmount,
      calculatedBalance: balanceAmount,
      appliedAt: new Date().toISOString(),
    },
  };
}
