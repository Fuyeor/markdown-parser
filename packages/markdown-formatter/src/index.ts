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
import type { Fence, ListIndentContext } from './types';

export * from './blocks';
export * from './constants';
export * from './text';
export * from './types';

/** Format a complete FFM document according to the editor's canonical style. */
export function format(content: string): string {
  if (typeof content !== 'string')
    throw new TypeError('content must be a string');
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
      if (formatted.at(-1) !== '') formatted.push('');
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
