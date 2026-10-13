'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function OrderSuccessClient() {
  useEffect(() => {
    // Fire celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#A84358', '#B0565F', '#d69532', '#f59e0b', '#10b981'],
    });
  }, []);

  return null;
}
