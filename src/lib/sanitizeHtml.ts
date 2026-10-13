/**
 * Lightweight, zero-dependency server & client safe HTML sanitizer
 * Strips script tags, iframes, inline event handlers (onerror, onload, etc.), and dangerous URI schemes.
 */
export function sanitizeHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  return rawHtml
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe, object, embed tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove inline event handlers (e.g. onclick=..., onerror=..., onload=...)
    .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Remove javascript: and vbscript: URLs
    .replace(/(href|src)\s*=\s*['"]\s*(?:javascript|vbscript|data):[^'"]*['"]/gi, '$1="#"');
}
