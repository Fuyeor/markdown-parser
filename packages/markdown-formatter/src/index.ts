// @fuyeor/markdown-formatter/src/index.ts

const CJK_CHARACTER = '\\p{Script=Han}';
const LATIN_OR_DIGIT = 'A-Za-z0-9';
const CJK_LATIN_BOUNDARY = new RegExp(
  `(?<=[${CJK_CHARACTER}])(?=[${LATIN_OR_DIGIT}])|(?<=[${LATIN_OR_DIGIT}])(?=[${CJK_CHARACTER}])`,
  'gu',
);
const INLINE_MARKUP_PATTERN = /(\*{1,3}|_{2}|--)([^\n]+?)\1/gu;
const LINK_TARGET_PATTERN = /(!?\[[^\]\n]*\])\(\s*([^)]*?\S)\s*\)/gu;
const SEMANTIC_FENCE_LANGUAGES = new Set([
  'quote',
  'slide',
  'chain',
  'accordion',
]);

type Fence = {
  character: '`' | '~';
  length: number;
  language?: string;
};

type QuoteLine = {
  content: string;
};

/** Normalize line endings before applying deterministic line-based formatting. */
function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/gu, '\n');
}

/** Return a fenced-block opener while leaving all fenced content untouched. */
function getFence(line: string): Fence | null {
  const match = line.match(/^\s*(`{3,}|~{3,})([A-Za-z][A-Za-z0-9_+.-]*)?\s*$/u);
  if (!match) return null;
  return {
    character: match[1]![0] as '`' | '~',
    length: match[1]!.length,
    language: match[2]?.toLowerCase(),
  };
}

/** Check whether a line closes the currently active fence. */
function isFenceClose(line: string, fence: Fence): boolean {
  const marker = fence.character === '`' ? '`' : '~';
  const expression = new RegExp(`^\\s*${marker}{${fence.length},}\\s*$`, 'u');
  return expression.test(line);
}

/** Split a table row without treating escaped or inline-code pipes as separators. */
function splitTableCells(line: string): string[] {
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
function getTableDelimiterCells(line: string): string[] | null {
  const cells = splitTableCells(line);
  if (cells.length === 0 || cells.some((cell) => !/^:?-{3,}:?$/u.test(cell))) {
    return null;
  }
  return cells;
}

/** Reduce table padding and delimiter runs to the canonical FFM representation. */
function formatTableRow(cells: readonly string[]): string {
  return `| ${cells.map(formatText).join(' | ')} |`;
}

/** Preserve alignment markers while removing redundant delimiter hyphens. */
function formatTableDelimiter(cells: readonly string[]): string {
  return formatTableRow(
    cells.map((cell) => {
      const leftAligned = cell.startsWith(':');
      const rightAligned = cell.endsWith(':');
      return `${leftAligned ? ':' : ''}---${rightAligned ? ':' : ''}`;
    }),
  );
}

/** Apply CJK spacing to plain text without interpreting protected inline code. */
function formatCjkBoundaries(segment: string): string {
  return segment.replace(CJK_LATIN_BOUNDARY, ' ');
}

/** Add spaces around inline markup when its content crosses a CJK boundary. */
function formatInlineMarkupBoundaries(segment: string): string {
  return segment.replace(
    INLINE_MARKUP_PATTERN,
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
        previous &&
        /\p{Script=Han}/u.test(previous) &&
        /[A-Za-z0-9]/u.test(inner[0]!)
          ? ' '
          : '';
      const trailingSpace =
        next &&
        /\p{Script=Han}/u.test(next) &&
        /[A-Za-z0-9]/u.test(inner.at(-1)!)
          ? ' '
          : '';
      return `${leadingSpace}${marker}${formatCjkBoundaries(inner)}${marker}${trailingSpace}`;
    },
  );
}

/** Trim only the outer whitespace of Markdown link destinations. */
function trimLinkTargets(segment: string): string {
  return segment.replace(
    LINK_TARGET_PATTERN,
    (_full: string, label: string, target: string) => `${label}(${target})`,
  );
}

/** Apply inline spacing and link cleanup to an unprotected text segment. */
function formatTextSegment(segment: string): string {
  return formatCjkBoundaries(
    formatInlineMarkupBoundaries(trimLinkTargets(segment)),
  );
}

/** Format ordinary text while preserving inline code and math tokens byte-for-byte. */
function formatText(line: string): string {
  let result = '';
  let segmentStart = 0;
  let index = 0;

  const appendPlainText = (end: number) => {
    result += formatTextSegment(line.slice(segmentStart, end));
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
        result += line.slice(index, contentEnd);
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

/** Count a contiguous run of the selected marker character. */
function countMarkerCharacters(
  line: string,
  start: number,
  marker: '`' | '$',
): number {
  let count = 0;
  while (line[start + count] === marker) count++;
  return count;
}

/** Normalize list indentation to the requested two-space maximum. */
function formatListLine(line: string): string | null {
  const match = line.match(/^(\s*)([-*]|\d+[.)])(?=\s+)/u);
  if (!match) return null;
  const markerEnd = match[1]!.length + match[2]!.length;
  const rest = formatText(line.slice(markerEnd).trimStart());
  const indentation = ' '.repeat(
    Math.min(match[1]!.replace(/\t/gu, '  ').length, 2),
  );
  return `${indentation}${match[2]} ${rest}`;
}

/** Format one non-fenced line without changing its Markdown delimiters. */
function formatOrdinaryLine(line: string): string {
  const listLine = formatListLine(line);
  const formatted = listLine ?? formatText(line);
  return formatted.replace(/[ \t]+$/u, '');
}

/** Parse a single line from a contiguous Markdown blockquote. */
function getQuoteLine(line: string): QuoteLine | null {
  const match = line.match(/^\s*>+\s?(.*)$/u);
  return match ? { content: match[1]! } : null;
}

/** Convert a blockquote with at least three non-empty quoted lines to FFM quote syntax. */
function formatDeepQuote(
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
  return {
    lines: ['```quote', ...content.map(formatOrdinaryLine), '```'],
    next,
  };
}

/** Format one complete Markdown table beginning at the supplied header line. */
function formatTable(
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
function formatSemanticFence(
  lines: readonly string[],
  start: number,
  fence: Fence,
): { lines: string[]; next: number } | null {
  if (!fence.language || !SEMANTIC_FENCE_LANGUAGES.has(fence.language)) {
    return null;
  }

  let closingIndex = start + 1;
  while (closingIndex < lines.length) {
    if (isFenceClose(lines[closingIndex]!, fence)) break;
    closingIndex++;
  }
  if (closingIndex >= lines.length) return null;

  const inner = format(lines.slice(start + 1, closingIndex).join('\n'));
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
function trimDocumentBoundary(lines: readonly string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]!.trim() === '') start++;
  while (end > start && lines[end - 1]!.trim() === '') end--;
  if (start === end) return '';

  const body = lines.slice(start, end);
  const firstLine = body[0]!;
  body[0] = formatListLine(firstLine) ?? firstLine.trimStart();
  return body.join('\n').replace(/[ \t]+$/u, '');
}

/** Format a complete FFM document according to the editor's canonical style. */
export function format(content: string): string {
  if (typeof content !== 'string')
    throw new TypeError('content must be a string');
  const lines = normalizeLineEndings(content).split('\n');
  const formatted: string[] = [];
  let fence: Fence | null = null;

  for (let index = 0; index < lines.length; ) {
    const line = lines[index]!;
    if (fence) {
      formatted.push(line);
      if (isFenceClose(line, fence)) fence = null;
      index++;
      continue;
    }

    const openingFence = getFence(line);
    if (openingFence) {
      const semanticFence = formatSemanticFence(lines, index, openingFence);
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

    formatted.push(formatOrdinaryLine(line));
    index++;
  }

  return trimDocumentBoundary(formatted);
}
