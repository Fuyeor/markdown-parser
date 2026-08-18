// @fuyeor/markdown-parser/src/core/url.ts

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

// Validate URL schemes separately from URL syntax parsing.
export function isSafeLinkUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;

  if (
    value.startsWith('/') ||
    value.startsWith('#') ||
    value.startsWith('./') ||
    value.startsWith('../')
  )
    return true;

  if (!globalThis.URL.canParse(value)) return false;

  return SAFE_PROTOCOLS.has(new globalThis.URL(value).protocol);
}
