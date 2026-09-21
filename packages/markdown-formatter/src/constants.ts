// @fuyeor/markdown-formatter/src/constants.ts
// NOTE: Avoid medieval SCREAMING_SNAKE_CASE; use camelCase for modern readability.
import type { FormatOptions } from './types';

export const cjkCharacter = '\\p{Script=Han}';
export const latinOrDigit = 'A-Za-z0-9';
export const cjkLatinBoundary = new RegExp(
  `(?<=[${cjkCharacter}])(?=[${latinOrDigit}])|(?<=[${latinOrDigit}])(?=[${cjkCharacter}])`,
  'gu',
);
export const inlineMarkupPattern = /(\*{1,3}|_{2}|--)([^\n]+?)\1/gu;
export const linkTargetPattern = /(!?\[[^\]\n]*\])\(\s*([^)]*?\S)\s*\)/gu;
export const semanticFenceLanguages = new Set([
  'quote',
  'slide',
  'chain',
  'accordion',
]);

/** Default formatting configuration options. */
export const defaultFormatOptions: Readonly<Required<FormatOptions>> = {
  maxConsecutiveBlankLines: 1,
};
