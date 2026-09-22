// @ffm/formatter/src/constant.ts
// NOTE: Avoid medieval SCREAMING_SNAKE_CASE; use camelCase for modern readability.
import type { FormatOption } from './type';

export const continuousScript =
  '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Thai}\\p{Script=Lao}\\p{Script=Myanmar}\\p{Script=Khmer}\\p{Script=Tibetan}';
export const hanKanaScript =
  '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}';

export const latinOrDigit = 'A-Za-z0-9';
export const latinBoundary = new RegExp(
  `(?<=[${continuousScript}])(?=[${latinOrDigit}])|(?<=[${latinOrDigit}])(?=[${continuousScript}])`,
  'gu',
);

export const inlineMarkupPattern = /(\*{1,3}|_{2}|--)([^\n]+?)\1/gu;
export const linkTargetPattern = /(!?\[[^\]\n]*\])\(\s*([^)]*?\S)\s*\)/gu;

// prettier-ignore
export const semanticFence = new Set([
  'quote', 'slide', 'chain', 'accordion',
]);

// prettier-ignore
export const titleCaseMinorWord = new Set([
  'a', 'an', 'the', 'and', 'but', 'or',
  'for', 'nor', 'as', 'at', 'by',
  'from', 'in', 'into', 'near', 'of', 'on',
  'onto', 'to', 'with', 'is',
]);

export const defaultFormatOption: Readonly<Required<FormatOption>> = {
  autoCase: {},
  continuousScript: {
    autoSpacing: true,
    autoUpperWord: false,
    fullwidthPunctuation: true,
  },
  transformer: (text: string) => text,
  maxBlankLine: 1,
};
