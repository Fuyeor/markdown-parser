// @fuyeor/markdown-formatter/src/index.ts
import {
  formatDeepQuote,
  formatOrdinaryLine,
  formatSemanticFence,
  formatTable,
  getFence,
  isFenceClose,
  normalizeLineEndings,
  trimDocumentBoundary,
} from './blocks';
import { defaultFormatOptions } from './constants';
import type { Fence, FormatOptions, ListIndentContext } from './types';

export * from './blocks';
export * from './constants';
export * from './text';
export * from './types';

/** Format a complete FFM document according to the editor's canonical style. */
export function format(content: string, options?: FormatOptions): string {
  if (typeof content !== 'string')
    throw new TypeError('content must be a string');

  const maxBlank =
    options?.maxConsecutiveBlankLines ??
    defaultFormatOptions.maxConsecutiveBlankLines;

  if (!Number.isInteger(maxBlank) || maxBlank < 0)
    throw new TypeError(
      'maxConsecutiveBlankLines must be a non-negative integer',
    );

  const lines = normalizeLineEndings(content).split('\n');
  const formatted: string[] = [];
  const listContext: ListIndentContext = { levels: [0] };
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
        options,
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

    const deepQuote = formatDeepQuote(lines, index);
    if (deepQuote) {
      formatted.push(...deepQuote.lines);
      index = deepQuote.next;
      continue;
    }

    const table = formatTable(lines, index);
    if (table) {
      formatted.push(...table.lines);
      index = table.next;
      continue;
    }

    formatted.push(formatOrdinaryLine(line, listContext));
    index++;
  }

  return trimDocumentBoundary(formatted);
}
