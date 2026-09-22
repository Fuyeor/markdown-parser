// @ffm/formatter/src/transform/case.ts
import { titleCaseMinorWord } from '#/constant';
import type { AutoCaseHeadingOption, AutoCaseOption } from '#/type';

/** Capitalize the first letter of each sentence while preserving subsequent casing. */
export function applySentenceCase(content: string): string {
  if (!content) return '';
  return content.replace(
    /(^\s*|[.?!]\s+|[。！？]\s*)([a-z])/gu,
    (_match, prefix, letter) => {
      return `${prefix}${letter.toUpperCase()}`;
    },
  );
}

/** Capitalize words in a heading based on the chosen casing style. */
export function applyHeadingCase(
  content: string,
  style: AutoCaseHeadingOption,
): string {
  if (!content) return '';
  if (style === 'sentence') {
    return applySentenceCase(content);
  }
  if (style === 'capitalize') {
    return content.replace(/\b[a-z]/gu, (letter) => letter.toUpperCase());
  }

  // AP / Chicago Title Case: Capitalize principal words while keeping minor words in lowercase
  const words = content.split(/(\s+)/u);
  return words
    .map((word, index) => {
      const isFirstOrLast = index === 0 || index === words.length - 1;
      const lower = word.toLowerCase();
      if (!isFirstOrLast && titleCaseMinorWord.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

/** Apply Western auto-casing rules according to the node context. */
export function applyAutoCase(
  content: string,
  option: AutoCaseOption | undefined,
  context: 'heading' | 'sentence',
): string {
  if (!content || !option) return content;
  if (context === 'heading' && option.heading) {
    return applyHeadingCase(content, option.heading);
  }
  if (option.sentence === 'capitalize') {
    return applySentenceCase(content);
  }
  return content;
}
