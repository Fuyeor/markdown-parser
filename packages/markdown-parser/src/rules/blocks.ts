// @fuyeor/markdown-parser/src/rules/blocks.ts
import type { ASTNode, BlockRule } from '#/types';
import { BlockState } from '#/core/state';

type FencedBlock = {
  lang: string;
  content: string;
  consumedLines: number;
};

const fencedBlockCache = new WeakMap<
  BlockState,
  Map<number, FencedBlock | null>
>();

/**
 * parse ATX # title syntax
 */
export const headingRule: BlockRule = {
  name: 'heading',
  markers: ['#'],
  parse(state: BlockState, ctx) {
    const line = state.currentLine;
    if (!line) return null;

    const match = line.match(/^\s{0,3}(#{1,6})(?:\s+(.*?))?(?:\s+#+)?\s*$/);
    if (!match) return null;

    return {
      node: {
        type: 'heading',
        level: match[1].length,
        children: match[2] ? ctx.parseInline(match[2].trim()) : [],
      },
      consumedLines: 1,
    };
  },
};

/**
 * parse ``` fenced code block
 */
export const codeBlockRule: BlockRule = {
  name: 'code_block',
  markers: ['`', '~'],
  parse(state: BlockState) {
    const block = extractFencedBlock(state);
    if (!block) return null;

    return {
      node: { type: 'code_block', lang: block.lang, content: block.content },
      consumedLines: block.consumedLines,
    };
  },
};

/**
 * helper function: extract code block
 */
export function extractFencedBlock(state: BlockState): FencedBlock | null {
  let cache = fencedBlockCache.get(state);
  if (!cache) {
    cache = new Map();
    fencedBlockCache.set(state, cache);
  }

  if (cache.has(state.lineIndex)) return cache.get(state.lineIndex) ?? null;

  const line = state.currentLine;
  if (!line) {
    cache.set(state.lineIndex, null);
    return null;
  }

  // matches 0-3 spaces starting with ``` or ~~~, followed by the info string
  const match = line.match(/^(\s{0,3})(`{3,}|~{3,})([^`]*)$/);
  if (!match) {
    cache.set(state.lineIndex, null);
    return null;
  }

  const indent = match[1].length;
  const indentPrefix = ' '.repeat(indent);
  const fenceMarker = match[2];
  const lang = match[3].trim();

  let consumedLines = 1;
  const contentLines: string[] = [];

  // find downwards for closed ```
  while (state.lineIndex + consumedLines < state.lineCount) {
    const nextLine = state.lines[state.lineIndex + consumedLines];
    consumedLines++;

    const closeMatch = nextLine.match(/^(\s{0,3})(`{3,}|~{3,})\s*$/);
    // closure conditions: Same symbol, length greater than or equal to the opening flag
    if (
      closeMatch &&
      closeMatch[2][0] === fenceMarker[0] &&
      closeMatch[2].length >= fenceMarker.length
    ) {
      break;
    }

    // remove indentation
    if (nextLine.startsWith(indentPrefix)) {
      contentLines.push(nextLine.slice(indent));
    } else {
      contentLines.push(nextLine);
    }
  }

  const result = { lang, content: contentLines.join('\n'), consumedLines };
  cache.set(state.lineIndex, result);
  return result;
}

const TABLE_SEPARATOR_PATTERN = /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/;
const TABLE_SEPARATOR_CELL_PATTERN = /^:?-+:?$/;

type TableAlignment = 'left' | 'center' | 'right' | undefined;

// Split table rows while treating escaped pipes as cell content.
const extractTableCells = (row: string) => {
  if (!row.includes('\\')) {
    const cells = row.split('|');
    if (cells[0]?.trim() === '') cells.shift();
    if (cells.at(-1)?.trim() === '') cells.pop();
    return cells.map((value) => value.trim());
  }

  const cells: string[] = [];
  let cell = '';
  let escaped = false;

  for (const char of row) {
    if (escaped) {
      cell += char === '|' || char === '\\' ? char : `\\${char}`;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '|') {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }

  if (escaped) cell += '\\';
  cells.push(cell);

  if (cells[0]?.trim() === '') cells.shift();
  if (cells.at(-1)?.trim() === '') cells.pop();
  return cells.map((value) => value.trim());
};

// Convert separator cells into the alignment metadata used by table cells.
const parseTableAlignments = (line: string): TableAlignment[] | null => {
  if (!TABLE_SEPARATOR_PATTERN.test(line)) return null;

  const separators = extractTableCells(line);
  if (
    separators.length === 0 ||
    separators.some((cell) => !TABLE_SEPARATOR_CELL_PATTERN.test(cell))
  )
    return null;

  return separators.map((separator) => {
    const startsWithColon = separator.startsWith(':');
    const endsWithColon = separator.endsWith(':');
    if (startsWithColon && endsWithColon) return 'center';
    if (startsWithColon) return 'left';
    if (endsWithColon) return 'right';
    return undefined;
  });
};

// Normalize rows to the separator-defined column count.
const normalizeTableCells = (cells: string[], columnCount: number) => {
  if (cells.length === columnCount) return cells;
  if (cells.length > columnCount) return cells.slice(0, columnCount);
  return cells.concat(Array(columnCount - cells.length).fill(''));
};

// Create table cells without allocating an alignment property for left-default columns.
const createTableCell = (
  content: string,
  alignment: TableAlignment,
  parseInline: (content: string) => ASTNode[],
): ASTNode => {
  const cell: ASTNode = {
    type: 'table_cell',
    children: parseInline(content),
  };
  if (alignment) cell.align = alignment;
  return cell;
};

/**
 * parse table |...| syntax
 */
export const tableRule: BlockRule = {
  name: 'table',
  markers: ['|'],
  parse(state: BlockState, ctx) {
    const line = state.currentLine;
    if (!line || !line.includes('|')) return null;

    const currentAlignments = parseTableAlignments(line);
    let alignments: TableAlignment[] | null = currentAlignments;
    let headerCells: string[] | undefined;
    let consumedLines = currentAlignments ? 1 : 0;

    if (!currentAlignments) {
      // A separator on the second line identifies a standard headed table.
      if (state.lineIndex + 1 >= state.lineCount) return null;
      const nextLine = state.lines[state.lineIndex + 1];
      alignments = parseTableAlignments(nextLine);
      if (!alignments) return null;

      headerCells = extractTableCells(line);
      consumedLines = 2;
      if (headerCells.length !== alignments.length) return null;
    }

    if (!alignments) return null;
    const columnCount = alignments.length;
    const headers = headerCells
      ? normalizeTableCells(headerCells, columnCount)
      : undefined;
    const rows = [];

    // Scan subsequent rows until a line without a pipe is encountered.
    while (state.lineIndex + consumedLines < state.lineCount) {
      const rowLine = state.lines[state.lineIndex + consumedLines];
      if (!rowLine.includes('|')) break;

      rows.push({
        type: 'table_row',
        children: normalizeTableCells(
          extractTableCells(rowLine),
          columnCount,
        ).map((cell, index) =>
          createTableCell(cell, alignments[index], ctx.parseInline),
        ),
      });
      consumedLines++;
    }

    return {
      node: {
        type: 'table',
        ...(headers
          ? {
              headers: headers.map((header, index) =>
                createTableCell(header, alignments[index], ctx.parseInline),
              ),
            }
          : {}),
        children: rows,
      },
      consumedLines,
    };
  },
};

/**
 * parse horizontal syntax (---, ***, ___)
 */
export const hrRule: BlockRule = {
  name: 'hr',
  markers: ['-', '*', '_'],
  parse(state: BlockState) {
    const line = state.currentLine;
    if (!line) return null;

    const prevLine =
      state.lineIndex > 0 ? state.lines[state.lineIndex - 1] : null;
    if (prevLine && prevLine.trim() !== '') return null;

    if (/^\s{0,3}([-*_]\s*){3,}\s*$/.test(line)) {
      return { node: { type: 'hr' }, consumedLines: 1 };
    }
    return null;
  },
};

/**
 * parse blockquote syntax (> quote)
 */
export const blockquoteRule: BlockRule = {
  name: 'blockquote',
  markers: ['>'],
  parse(state: BlockState, ctx) {
    const line = state.currentLine;
    if (!line || !line.trimStart().startsWith('>')) return null;

    const contentLines: string[] = [];
    let consumedLines = 0;

    while (state.lineIndex + consumedLines < state.lineCount) {
      const currentLine = state.lines[state.lineIndex + consumedLines];

      // If the line starts with '>', consume it.
      // If it's a "lazy continuation" (no '>' but the previous line had one),
      // we also consume it until an empty line appears.
      const match = currentLine.match(/^\s*>\s?(.*)/);
      if (match) {
        contentLines.push(match[1]);
      } else if (currentLine.trim() !== '' && contentLines.length > 0) {
        contentLines.push(currentLine.trimStart());
      } else {
        break;
      }
      consumedLines++;
    }

    return {
      node: {
        type: 'blockquote',
        children: ctx.parseBlocks(contentLines.join('\n')),
      },
      consumedLines,
    };
  },
};

const LIST_ITEM_PATTERN = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)/;
const LIST_INDENT_STEP = 2;

/**
 * parse list syntax (- xxx)
 */
export const listRule: BlockRule = {
  name: 'list',
  markers: ['-', '*', '+', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  parse(state: BlockState, ctx) {
    const line = state.currentLine;
    if (!line) return null;

    // match list header: supports -, *, + and 1., 99)
    const match = line.match(LIST_ITEM_PATTERN);
    if (!match) return null;

    const baseIndent = match[1].length;
    const marker = match[2];
    const isOrdered = /\d/.test(marker);
    const startNumber = isOrdered ? parseInt(marker, 10) : undefined;

    const items: ASTNode[] = [];
    let consumedLines = 0;

    while (state.lineIndex + consumedLines < state.lineCount) {
      const currentLine = state.lines[state.lineIndex + consumedLines];
      const itemMatch = currentLine.match(LIST_ITEM_PATTERN);

      // to determine if an item is a new list item:
      // the indentation must be consistent with the baseline
      if (itemMatch && itemMatch[1].length === baseIndent) {
        let itemLines: string[] = [itemMatch[3]];
        let itemConsumedLines = 1;

        // detect subsequent lines belonging to this item
        // (lines with indentation deeper than the marker).
        const markerTotalWidth = baseIndent + marker.length + 1;
        // Normalize nested list markers to two-space logical levels, tolerating odd legacy indentation.
        const nestedListIndent = baseIndent + LIST_INDENT_STEP;

        while (
          state.lineIndex + consumedLines + itemConsumedLines <
          state.lineCount
        ) {
          const nextLine =
            state.lines[state.lineIndex + consumedLines + itemConsumedLines];
          if (nextLine.trim() === '') {
            itemLines.push('');
            itemConsumedLines++;
            continue;
          }

          const nextIndent = nextLine.match(/^(\s*)/)![1].length;
          const firstContentChar = nextLine[nextIndent];
          const isListMarkerCandidate =
            firstContentChar === '-' ||
            firstContentChar === '*' ||
            firstContentChar === '+' ||
            (firstContentChar >= '0' && firstContentChar <= '9');
          let normalizedContentStart = markerTotalWidth;

          if (nextIndent >= nestedListIndent && isListMarkerCandidate) {
            const relativeIndent = nextIndent - baseIndent;
            const nestingLevel = Math.floor(relativeIndent / LIST_INDENT_STEP);
            const contentIndent = (nestingLevel - 1) * LIST_INDENT_STEP;
            normalizedContentStart = nextIndent - contentIndent;
          }

          if (
            normalizedContentStart !== markerTotalWidth &&
            LIST_ITEM_PATTERN.test(nextLine)
          ) {
            itemLines.push(nextLine.slice(normalizedContentStart));
            itemConsumedLines++;
          } else if (nextIndent >= markerTotalWidth) {
            // remove the indentation corresponding to the width
            itemLines.push(nextLine.slice(markerTotalWidth));
            itemConsumedLines++;
          } else if (
            nextIndent > baseIndent &&
            !nextLine.match(/^\s*[-*+\d]/)
          ) {
            itemLines.push(nextLine.trimStart());
            itemConsumedLines++;
          } else {
            break;
          }
        }

        items.push({
          type: 'list_item',
          children: ctx.parseBlocks(itemLines.join('\n')),
        });
        consumedLines += itemConsumedLines;
      } else {
        break;
      }
    }

    return {
      node: {
        type: 'list',
        ordered: isOrdered,
        start: startNumber,
        children: items,
      },
      consumedLines,
    };
  },
};
