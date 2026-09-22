// @ffm/formatter/src/transform/continuous.ts
import { latinBoundary } from '#/constant';
import { applyPunctuation } from './punctuation';
import type { ContinuousScriptOption } from '#/type';

/** Insert spacing between CJK characters and Latin/digit boundaries. */
export function applyAutoSpacing(content: string): string {
  return content.replace(latinBoundary, ' ');
}

/** Capitalize standalone English words embedded in continuous script text. */
export function applyAutoUpperWord(content: string): string {
  return content.replace(/\b[a-z]+(?:-[a-z]+)*\b/gu, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

/** Apply continuous script formatting rules including auto spacing and upper word capitalization. */
export function applyContinuousScript(
  content: string,
  option?: ContinuousScriptOption,
): string {
  if (!content || !option) return content;
  let result = content;
  if (option.autoSpacing) {
    result = applyAutoSpacing(result);
  }
  if (option.autoUpperWord) {
    result = applyAutoUpperWord(result);
  }
  // Chinese and Japanese full-width punctuation normalization
  if (option.fullwidthPunctuation) {
    result = applyPunctuation(result);
  }
  return result;
}
