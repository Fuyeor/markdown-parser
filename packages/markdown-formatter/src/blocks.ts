// @fuyeor/markdown-formatter/src/blocks.ts
import { semanticFenceLanguages } from './constants';
import { formatText } from './text';
import type { Fence, ListIndentContext, QuoteLine } from './types';

/** Normalize line endings before applying deterministic line-based formatting. */
export function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/gu, '\n');
}

/** Return a fenced-block opener while leaving all fenced content untouched. */
export function getFence(line: string): Fence | null {
  const match = line.match(/^\s*(`{3,}|~{3,})([A-Za-z][A-Za-z0-9_+.-]*)?\s*$/u);
  if (!match) return null;
  return {
    character: match[1]![0] as '`' | '~',
    length: match[1]!.length,
    language: match[2]?.toLowerCase(),
  };
}

/** Check whether a line closes the currently active fence. */
export function isFenceClose(line: string, fence: Fence): boolean {
  const marker = fence.character === '`' ? '`' : '~';
  const expression = new RegExp(`^\\s*${marker}{${fence.length},}\\s*$`, 'u');
  return expression.test(line);
}

/** Split a table row without treating escaped or inline-code pipes as separators. */
export function splitTableCells(line: string): string[] {
  const source = line.trim();
  const content = source.startsWith('|') ? source.slice(1) : source;
  const cells: string[] = [];
  let cell = '';
  let inlineCodeMarker = '';

  for (let index = 0; index < content.length; index++) {
    const character = content[index]!;
    if (character === '\\' && content[index + 1] === '|') {
      cell += '|';
      index++;
      continue;
    }
    if (character === '`') {
      let markerLength = 1;
      while (content[index + markerLength] === '`') markerLength++;
      const marker = '`'.repeat(markerLength);
      inlineCodeMarker =
        inlineCodeMarker === marker ? '' : inlineCodeMarker || marker;
      cell += marker;
      index += markerLength - 1;
      continue;
    }
    if (character === '|' && !inlineCodeMarker) {
      cells.push(cell.trim());
      cell = '';
      continue;
    }
    cell += character;
  }
  cells.push(cell.trim());
  if (cells.at(-1) === '') cells.pop();
  return cells;
}

/** Identify the Markdown table delimiter row and its alignment cells. */
export function getTableDelimiterCells(line: string): string[] | null {
  const cells = splitTableCells(line);
  if (cells.length === 0 || cells.some((cell) => !/^:?-{3,}:?$/u.test(cell))) {
    return null;
  }
  return cells;
}

/** Reduce table padding and delimiter runs to the canonical FFM representation. */
export function formatTableRow(cells: readonly string[]): string {
  return `| ${cells.map(formatText).join(' | ')} |`;
}

/** Preserve alignment markers while removing redundant delimiter hyphens. */
export function formatTableDelimiter(cells: readonly string[]): string {
  return formatTableRow(
    cells.map((cell) => {
      const leftAligned = cell.startsWith(':');
      const rightAligned = cell.endsWith(':');
      return `${leftAligned ? ':' : ''}---${rightAligned ? ':' : ''}`;
    }),
  );
}

/** Normalize one list level to two spaces while preserving nested list depth. */
export function formatListLine(
  line: string,
  context: ListIndentContext,
): string | null {
  const match = line.match(/^(\s*)([-*]|\d+[.)])(?=\s+)/u);
  if (!match) return null;

  const rawIndentation = match[1]!.replace(/\t/gu, '  ').length;
  while (context.levels.length > 1 && rawIndentation < context.levels.at(-1)!) {
    context.levels.pop();
  }
  if (rawIndentation > context.levels.at(-1)!) {
    context.levels.push(rawIndentation);
  }

  const markerEnd = match[1]!.length + match[2]!.length;
  const rest = formatText(line.slice(markerEnd).trimStart());
  const indentation = ' '.repeat((context.levels.length - 1) * 2);
  return `${indentation}${match[2]} ${rest}`;
}

/** Normalize one Markdown blockquote marker and its content spacing. */
export function formatQuoteLine(line: string): string | null {
  const match = line.match(/^\s*(>+)[ \t]*(.*)$/u);
  if (!match) return null;
  const content = formatText(match[2]!.trimStart());
  return content ? `${match[1]} ${content}` : match[1]!;
}

/** Format one non-fenced line without changing its Markdown delimiters. */
export function formatOrdinaryLine(
  line: string,
  context: ListIndentContext,
): string {
  const quoteLine = formatQuoteLine(line);
  const listLine = formatListLine(line, context);
  const formatted = quoteLine ?? listLine ?? formatText(line).trimStart();
  if (!listLine) context.levels = [0];
  return formatted.replace(/[ \t]+$/u, '');
}

/** Parse a single line from a contiguous Markdown blockquote. */
export function getQuoteLine(line: string): QuoteLine | null {
  const match = line.match(/^\s*>+\s?(.*)$/u);
  return match ? { content: match[1]! } : null;
}

/** Convert a blockquote with at least three non-empty quoted lines to FFM quote syntax. */
export function formatDeepQuote(
  lines: readonly string[],
  start: number,
): { lines: string[]; next: number } | null {
  const first = getQuoteLine(lines[start]!);
  if (!first) return null;

  const content = [first.content];
  let next = start + 1;
  while (next < lines.length) {
    const continuation = getQuoteLine(lines[next]!);
    if (!continuation) break;
    content.push(continuation.content);
    next++;
  }

  if (content.filter((line) => line.trim() !== '').length < 3) return null;
  const listContext: ListIndentContext = { levels: [0] };
  return {
    lines: [
      '```quote',
      ...content.map((line) => formatOrdinaryLine(line, listContext)),
      '```',
    ],
    next,
  };
}

/** Format one complete Markdown table beginning at the supplied header line. */
export function formatTable(
  lines: readonly string[],
  start: number,
): { lines: string[]; next: number } | null {
  if (!lines[start]!.includes('|')) return null;
  const delimiterCells = getTableDelimiterCells(lines[start + 1] ?? '');
  if (!delimiterCells) return null;

  const formatted = [
    formatTableRow(splitTableCells(lines[start]!)),
    formatTableDelimiter(delimiterCells),
  ];
  let next = start + 2;
  while (next < lines.length && lines[next]!.includes('|')) {
    formatted.push(formatTableRow(splitTableCells(lines[next]!)));
    next++;
  }
  return { lines: formatted, next };
}

/** Format content inside FFM semantic fences while preserving their delimiters. */
export function formatSemanticFence(
  lines: readonly string[],
  start: number,
  fence: Fence,
  formatFn: (content: string) => string,
): { lines: string[]; next: number } | null {
  if (!fence.language || !semanticFenceLanguages.has(fence.language)) {
    return null;
  }

  let closingIndex = start + 1;
  while (closingIndex < lines.length) {
    if (isFenceClose(lines[closingIndex]!, fence)) break;
    closingIndex++;
  }
  if (closingIndex >= lines.length) return null;

  const inner = formatFn(lines.slice(start + 1, closingIndex).join('\n'));
  return {
    lines: [
      lines[start]!,
      ...(inner ? inner.split('\n') : []),
      lines[closingIndex]!,
    ],
    next: closingIndex + 1,
  };
}

/** Remove empty boundary lines without treating list indentation as disposable file whitespace. */
export function trimDocumentBoundary(lines: readonly string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]!.trim() === '') start++;
  while (end > start && lines[end - 1]!.trim() === '') end--;
  if (start === end) return '';

  const body = lines.slice(start, end);
  const listContext: ListIndentContext = { levels: [0] };
  body[0] = formatOrdinaryLine(body[0]!, listContext);
  return body.join('\n').replace(/[ \t]+$/u, '');
}
