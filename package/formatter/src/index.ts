// @ffm/formatter/src/index.ts
import {
  formatDeepQuote,
  formatOrdinaryLine,
  formatSemanticFence,
  formatTable,
  getFence,
  isFenceClose,
  normalizeLineEndings,
  trimDocumentBoundary,
} from './block';
import { defaultFormatOption } from './constant';
import type { Fence, FormatOption, ListIndentContext } from './type';

export * from './block';
export * from './constant';
export * from './text';
export * from './transform';
export * from './type';

/** Format a complete FFM document according to canonical style and typography rules. */
export function format(content: string, option?: FormatOption): string {
  if (typeof content !== 'string') {
    throw new TypeError('content must be a string');
  }

  // merge default config
  const resolvedOption: FormatOption = {
    ...defaultFormatOption,
    ...option,
    continuousScript: {
      ...defaultFormatOption.continuousScript,
      ...option?.continuousScript,
    },
    autoCase: {
      ...defaultFormatOption.autoCase,
      ...option?.autoCase,
    },
  };

  const maxBlank = resolvedOption.maxBlankLine ?? 1;
  const lines = normalizeLineEndings(content).split('\n');
  const formatted: string[] = [];
  const listContext: ListIndentContext = { levels: [] };

  let fence: Fence | null = null;

  for (let index = 0; index < lines.length; ) {
    const line = lines[index]!;
    if (fence) {
      formatted.push(line);
      if (isFenceClose(line, fence)) fence = null;
      index++;
      continue;
    }

    if (line.trim() === '') {
      let trailingEmpty = 0;
      for (
        let cursor = formatted.length - 1;
        cursor >= 0 && formatted[cursor] === '';
        cursor--
      ) {
        trailingEmpty++;
      }
      // Whether to retain blank lines depends on the maximum allowed number of blank lines.
      if (trailingEmpty < maxBlank) formatted.push('');
      index++;
      continue;
    }

    const openingFence = getFence(line);
    if (openingFence) {
      const semanticFence = formatSemanticFence(
        lines,
        index,
        openingFence,
        format,
        resolvedOption,
      );
      if (semanticFence) {
        formatted.push(...semanticFence.lines);
        index = semanticFence.next;
        continue;
      }
      fence = openingFence;
      formatted.push(line);
      index++;
      continue;
    }

    const deepQuote = formatDeepQuote(lines, index, resolvedOption);
    if (deepQuote) {
      formatted.push(...deepQuote.lines);
      index = deepQuote.next;
      continue;
    }

    const table = formatTable(lines, index, resolvedOption);
    if (table) {
      formatted.push(...table.lines);
      index = table.next;
      continue;
    }

    formatted.push(formatOrdinaryLine(line, listContext, resolvedOption));
    index++;
  }

  return trimDocumentBoundary(formatted);
}
