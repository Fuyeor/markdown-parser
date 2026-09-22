// @ffm/formatter/src/transform/punctuation.ts
import { hanKanaScript } from '#/constant';

/** Convert ASCII commas to full-width when adjacent to CJK characters. */
export function normalizeComma(content: string): string {
  return content
    .replace(new RegExp(`([${hanKanaScript}])\\s*,`, 'gu'), '$1，')
    .replace(new RegExp(`,\\s*([${hanKanaScript}])`, 'gu'), '，$1');
}

/** Convert ASCII colons to full-width when tightly flanked by CJK characters. */
export function normalizeColon(content: string): string {
  return content.replace(
    new RegExp(`(?<=[${hanKanaScript}]):(?=[${hanKanaScript}])`, 'gu'),
    '：',
  );
}

/** Convert ASCII periods to full-width when immediately preceded by CJK characters. */
export function normalizePeriod(content: string): string {
  return content.replace(
    new RegExp(`(?<=[${hanKanaScript}])\\.(?![a-zA-Z0-9_])`, 'gu'),
    '。',
  );
}

/** Convert ASCII parentheses to full-width when enclosed content contains CJK characters. */
export function normalizeParentheses(content: string): string {
  return content.replace(
    new RegExp(`\\(([^()]*?[${hanKanaScript}][^()]*?)\\)`, 'gu'),
    '（$1）',
  );
}

/** Apply full-width punctuation conversions based on rigorous CJK context boundaries. */
export function applyPunctuation(content: string): string {
  if (!content) return '';
  return normalizeParentheses(
    normalizePeriod(normalizeColon(normalizeComma(content))),
  );
}
