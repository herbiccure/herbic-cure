/**
 * Code 128 Type B Barcode SVG Generator
 * Pure TypeScript implementation without external dependencies.
 * Standard format used across logistics carriers (Delhivery, FedEx, Bluedart, etc.)
 */

// Code 128 patterns (widths of bars and spaces, 6 elements totaling 11 modules each)
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2], // 0 (space)
  [2, 2, 2, 1, 2, 2], // 1 (!)
  [2, 2, 2, 2, 2, 1], // 2 (")
  [1, 2, 1, 2, 2, 3], // 3 (#)
  [1, 2, 1, 3, 2, 2], // 4 ($)
  [1, 3, 1, 2, 2, 2], // 5 (%)
  [1, 2, 2, 2, 1, 3], // 6 (&)
  [1, 2, 2, 3, 1, 2], // 7 (')
  [1, 3, 2, 2, 1, 2], // 8 (()
  [2, 2, 1, 2, 1, 3], // 9 ())
  [2, 2, 1, 3, 1, 2], // 10 (*)
  [2, 3, 1, 2, 1, 2], // 11 (+)
  [1, 1, 2, 2, 3, 2], // 12 (,)
  [1, 2, 2, 1, 3, 2], // 13 (-)
  [1, 2, 2, 2, 3, 1], // 14 (.)
  [1, 1, 3, 2, 2, 2], // 15 (/)
  [1, 2, 3, 1, 2, 2], // 16 (0)
  [1, 2, 3, 2, 2, 1], // 17 (1)
  [2, 2, 3, 2, 1, 1], // 18 (2)
  [2, 2, 1, 1, 3, 2], // 19 (3)
  [2, 2, 1, 2, 3, 1], // 20 (4)
  [2, 1, 3, 2, 1, 2], // 21 (5)
  [2, 2, 3, 1, 1, 2], // 22 (6)
  [3, 1, 2, 1, 3, 1], // 23 (7)
  [3, 1, 1, 2, 2, 2], // 24 (8)
  [3, 2, 1, 1, 2, 2], // 25 (9)
  [3, 2, 1, 2, 2, 1], // 26 (:)
  [3, 1, 2, 2, 1, 2], // 27 (;)
  [3, 2, 2, 1, 1, 2], // 28 (<)
  [3, 2, 2, 2, 1, 1], // 29 (=)
  [2, 1, 2, 1, 2, 3], // 30 (>)
  [2, 1, 2, 3, 2, 1], // 31 (?)
  [2, 3, 2, 1, 2, 1], // 32 (@)
  [1, 1, 1, 3, 2, 3], // 33 (A)
  [1, 3, 1, 1, 2, 3], // 34 (B)
  [1, 3, 1, 3, 2, 1], // 35 (C)
  [1, 1, 2, 3, 1, 3], // 36 (D)
  [1, 3, 2, 1, 1, 3], // 37 (E)
  [1, 3, 2, 3, 1, 1], // 38 (F)
  [2, 1, 1, 3, 1, 3], // 39 (G)
  [2, 3, 1, 1, 1, 3], // 40 (H)
  [2, 3, 1, 3, 1, 1], // 41 (I)
  [1, 1, 2, 1, 3, 3], // 42 (J)
  [1, 1, 2, 3, 3, 1], // 43 (K)
  [1, 3, 2, 1, 3, 1], // 44 (L)
  [1, 1, 3, 1, 2, 3], // 45 (M)
  [1, 1, 3, 3, 2, 1], // 46 (N)
  [1, 3, 3, 1, 2, 1], // 47 (O)
  [3, 1, 3, 1, 2, 1], // 48 (P)
  [2, 1, 1, 3, 3, 1], // 49 (Q)
  [2, 3, 1, 1, 3, 1], // 50 (R)
  [2, 1, 3, 1, 1, 3], // 51 (S)
  [2, 1, 3, 3, 1, 1], // 52 (T)
  [2, 1, 3, 1, 3, 1], // 53 (U)
  [3, 1, 1, 1, 2, 3], // 54 (V)
  [3, 1, 1, 3, 2, 1], // 55 (W)
  [3, 3, 1, 1, 2, 1], // 56 (X)
  [3, 1, 2, 1, 1, 3], // 57 (Y)
  [3, 1, 2, 3, 1, 1], // 58 (Z)
  [3, 3, 2, 1, 1, 1], // 59 ([)
  [3, 1, 4, 1, 1, 1], // 60 (\)
  [2, 2, 1, 4, 1, 1], // 61 (])
  [4, 3, 1, 1, 1, 1], // 62 (^)
  [1, 1, 1, 2, 2, 4], // 63 (_)
  [1, 1, 1, 4, 2, 2], // 64 (`)
  [1, 2, 1, 1, 2, 4], // 65 (a)
  [1, 2, 1, 4, 2, 1], // 66 (b)
  [1, 4, 1, 1, 2, 2], // 67 (c)
  [1, 4, 1, 2, 2, 1], // 68 (d)
  [1, 1, 2, 2, 1, 4], // 69 (e)
  [1, 1, 2, 4, 1, 2], // 70 (f)
  [1, 2, 2, 1, 1, 4], // 71 (g)
  [1, 2, 2, 4, 1, 1], // 72 (h)
  [1, 4, 2, 1, 1, 2], // 73 (i)
  [1, 4, 2, 2, 1, 1], // 74 (j)
  [2, 4, 1, 2, 1, 1], // 75 (k)
  [2, 2, 1, 1, 1, 4], // 76 (l)
  [4, 1, 3, 1, 1, 1], // 77 (m)
  [2, 4, 1, 1, 1, 2], // 78 (n)
  [1, 3, 4, 1, 1, 1], // 79 (o)
  [1, 1, 1, 2, 4, 2], // 80 (p)
  [1, 2, 1, 1, 4, 2], // 81 (q)
  [1, 2, 1, 2, 4, 1], // 82 (r)
  [1, 1, 4, 2, 1, 2], // 83 (s)
  [1, 2, 4, 1, 1, 2], // 84 (t)
  [1, 2, 4, 2, 1, 1], // 85 (u)
  [4, 1, 1, 2, 1, 2], // 86 (v)
  [4, 2, 1, 1, 1, 2], // 87 (w)
  [4, 2, 1, 2, 1, 1], // 88 (x)
  [2, 1, 2, 1, 4, 1], // 89 (y)
  [2, 1, 4, 1, 2, 1], // 90 (z)
  [4, 1, 2, 1, 2, 1], // 91 ({)
  [1, 1, 1, 1, 4, 3], // 92 (|)
  [1, 1, 1, 3, 4, 1], // 93 (})
  [1, 3, 1, 1, 4, 1], // 94 (~)
  [1, 1, 4, 1, 1, 3], // 95
  [1, 1, 4, 3, 1, 1], // 96
  [4, 1, 1, 1, 1, 3], // 97
  [4, 1, 1, 3, 1, 1], // 98
  [1, 1, 3, 1, 4, 1], // 99
  [1, 1, 4, 1, 3, 1], // 100
  [3, 1, 1, 1, 4, 1], // 101
  [4, 1, 1, 1, 3, 1], // 102
  [2, 1, 1, 4, 1, 2], // 103 (Start A)
  [2, 1, 1, 2, 1, 4], // 104 (Start B)
  [2, 1, 1, 2, 3, 2], // 105 (Start C)
];

// Stop pattern: 7 elements
const STOP_PATTERN = [2, 3, 3, 1, 1, 1, 2];

export interface BarcodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Generates SVG barcode rectangle bars using Code 128 Subset B.
 */
export function generateCode128Bars(
  text: string,
  options: {
    height?: number;
    moduleWidth?: number;
    quietZone?: number;
  } = {}
): {
  bars: BarcodeRect[];
  totalWidth: number;
  height: number;
} {
  const height = options.height || 50;
  const moduleWidth = options.moduleWidth || 2;
  const quietZone = options.quietZone ?? 10;

  const cleanText = (text || '').trim();
  if (!cleanText) {
    return { bars: [], totalWidth: quietZone * 2, height };
  }

  // Start with Code Set B (index 104)
  const codes: number[] = [104];
  let checksum = 104;

  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    const codeVal = charCode - 32; // Map ASCII 32..126 to 0..94
    if (codeVal >= 0 && codeVal <= 94) {
      codes.push(codeVal);
      checksum += codeVal * (i + 1);
    }
  }

  const checkDigit = checksum % 103;
  codes.push(checkDigit);

  // Build pattern list: start, characters, checksum, stop
  const patterns: number[][] = [];
  for (const c of codes) {
    patterns.push(CODE128_PATTERNS[c] || CODE128_PATTERNS[0]);
  }
  patterns.push(STOP_PATTERN);

  let currentX = quietZone;
  const bars: BarcodeRect[] = [];

  for (const pattern of patterns) {
    for (let pIdx = 0; pIdx < pattern.length; pIdx++) {
      const width = pattern[pIdx] * moduleWidth;
      const isBar = pIdx % 2 === 0; // Alternating bar and space
      if (isBar) {
        bars.push({
          x: currentX,
          y: 0,
          width,
          height,
        });
      }
      currentX += width;
    }
  }

  const totalWidth = currentX + quietZone;
  return { bars, totalWidth, height };
}

