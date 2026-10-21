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
