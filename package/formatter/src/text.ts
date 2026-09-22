// @ffm/formatter/src/text.ts
import {
  latinBoundary,
  continuousScript,
  inlineMarkupPattern,
  latinOrDigit,
  linkTargetPattern,
} from './constant';
import {
  applyAutoCase,
  applyContinuousScript,
  applyGlossary,
  applyPunctuation,
} from './transform';
import type { FormatOption } from './type';

/** Check whether a single character is a CJK Han or Kana character. */
export function isCjkCharacter(character: string | undefined): boolean {
  return (
    character !== undefined &&
    new RegExp(`^[${continuousScript}]$`, 'u').test(character)
  );
}

/** Check whether a single character is a Latin letter or an ASCII digit. */
export function isLatinOrDigitCharacter(
  character: string | undefined,
): boolean {
  return (
    character !== undefined &&
    new RegExp(`^[${latinOrDigit}]$`, 'u').test(character)
  );
}

/** Collapse runs of horizontal whitespace in unprotected text to one space. */
export function normalizeHorizontalWhitespace(segment: string): string {
  return segment.replace(/[ \t]+/gu, ' ');
}

/** Apply CJK spacing to plain text without interpreting protected inline code. */
export function formatCjkBoundaries(segment: string): string {
  return segment.replace(latinBoundary, ' ');
}

/** Add spaces around inline markup when its content crosses a CJK boundary. */
export function formatInlineMarkupBoundaries(segment: string): string {
  return segment.replace(
    inlineMarkupPattern,
    (
      full: string,
      marker: string,
      inner: string,
      offset: number,
      source: string,
    ) => {
      const previous = source[offset - 1];
      const next = source[offset + full.length];
      const leadingSpace =
        isCjkCharacter(previous) && isLatinOrDigitCharacter(inner[0])
          ? ' '
          : '';
      const trailingSpace =
        isCjkCharacter(next) && isLatinOrDigitCharacter(inner.at(-1))
          ? ' '
          : '';
      return `${leadingSpace}${marker}${formatCjkBoundaries(inner)}${marker}${trailingSpace}`;
    },
  );
}

/** Trim only the outer whitespace of Markdown link destinations. */
export function trimLinkTargets(segment: string): string {
  return segment.replace(
    linkTargetPattern,
    (_full: string, label: string, target: string) => `${label}(${target})`,
  );
}

/** Apply typography rules and inline spacing to an unprotected text segment. */
export function formatTextSegment(
  segment: string,
  option: FormatOption | undefined,
  context: 'heading' | 'sentence' = 'sentence',
): string {
  let text = segment;

  // 1. Glossary replacement
  text = applyGlossary(text, option?.autoCase?.glossary);

  // 2. Custom transformer callback
  if (option?.transformer) {
    text = option.transformer(text);
  }

  // 3. Western auto casing
  text = applyAutoCase(text, option?.autoCase, context);

  // 4. Continuous script formatting
  text = applyContinuousScript(text, option?.continuousScript);

  // 5. CJK punctuation normalization
  text = applyPunctuation(text);

  // 6. Whitespace and inline markup spacing
  text = formatCjkBoundaries(
    formatInlineMarkupBoundaries(
      normalizeHorizontalWhitespace(trimLinkTargets(text)),
    ),
  );

  return text;
}

/** Count a contiguous run of the selected marker character. */
export function countMarkerCharacters(
  line: string,
  start: number,
  marker: '`' | '$',
): number {
  let count = 0;
  while (line[start + count] === marker) count++;
  return count;
}

/** Add CJK spacing around a protected inline token without changing its content. */
export function formatProtectedToken(
  token: string,
  previous: string | undefined,
  next: string | undefined,
): string {
  const marker =
    token[0] === '`'
      ? '`'.repeat(countMarkerCharacters(token, 0, '`'))
      : token.startsWith('$$')
        ? '$$'
        : '$';
  const inner = token.slice(marker.length, -marker.length);
  const leadingSpace =
    isCjkCharacter(previous) &&
    (isLatinOrDigitCharacter(inner[0]) || isCjkCharacter(inner[0]))
      ? ' '
      : '';
  const trailingSpace =
    isCjkCharacter(next) &&
    (isLatinOrDigitCharacter(inner.at(-1)) || isCjkCharacter(inner.at(-1)))
      ? ' '
      : '';
  return `${leadingSpace}${token}${trailingSpace}`;
}

/** Format ordinary text while preserving inline code and math tokens byte-for-byte. */
export function formatText(
  line: string,
  option?: FormatOption,
  context: 'heading' | 'sentence' = 'sentence',
): string {
  let result = '';
  let segmentStart = 0;
  let index = 0;

  const appendPlainText = (end: number) => {
    result += formatTextSegment(line.slice(segmentStart, end), option, context);
  };

  while (index < line.length) {
    const character = line[index]!;
    if (character === '`' || character === '$') {
      const marker =
        character === '`'
          ? '`'.repeat(countMarkerCharacters(line, index, '`'))
          : line.startsWith('$$', index)
            ? '$$'
            : '$';
      const contentStart = index + marker.length;
      const closingIndex = line.indexOf(marker, contentStart);
      if (
        closingIndex !== -1 &&
        (character !== '$' || marker === '$$' || closingIndex > contentStart)
      ) {
        appendPlainText(index);
        const contentEnd = closingIndex + marker.length;
        result += formatProtectedToken(
          line.slice(index, contentEnd),
          line[index - 1],
          line[contentEnd],
        );
        index = contentEnd;
        segmentStart = index;
        continue;
      }
    }
    index++;
  }

  appendPlainText(line.length);
  return result;
}
