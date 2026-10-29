import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes image URLs, converting Google Drive web preview links
 * (e.g. https://drive.google.com/file/d/ID/view?usp=drivesdk) into direct CDN image endpoints
 * (https://lh3.googleusercontent.com/d/ID) so Next.js <Image /> and browser <img> can render them.
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Match Google Drive preview, share, or uc URLs
  const driveMatch =
    trimmed.match(/(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/(?:drive|docs)\.google\.com\/(?:open|uc|download)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/drive\.usercontent\.google\.com\/download\?[^#]*\bid=([a-zA-Z0-9_-]+)/i);

  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Dropbox share link to direct download
  if (trimmed.includes('dropbox.com') && trimmed.includes('dl=0')) {
    return trimmed.replace('dl=0', 'raw=1');
  }

  return trimmed;
}

/**
 * Normalizes Indian mobile number by removing +91, 0 prefix, and non-digits.
 */
export function cleanIndianMobile(val: string | null | undefined): string {
  if (!val || typeof val !== 'string') return '';
  let digits = val.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Validates whether a given phone number is a valid 10-digit Indian mobile number.
 * Valid Indian mobile numbers must be exactly 10 digits and start with 6, 7, 8, or 9.
 */
export function validateIndianMobile(phone: string | null | undefined): {
  valid: boolean;
  phone: string;
  error?: string;
} {
  const cleaned = cleanIndianMobile(phone);
  if (!cleaned) {
    return { valid: false, phone: '', error: 'Mobile number is required.' };
  }
  if (cleaned.length !== 10) {
    return { valid: false, phone: cleaned, error: 'Mobile number must be exactly 10 digits.' };
  }
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      valid: false,
      phone: cleaned,
      error: 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.',
    };
  }
  return { valid: true, phone: cleaned };
}
