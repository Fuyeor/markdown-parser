// @fuyeor/markdown-parser/src/rules/blocks.ts
import type { BlockRule } from '#/types';
import { BlockState } from '#/core/state';

/**
 * parse ATX # title syntax
 */
export const headingRule: BlockRule = {
  name: 'heading',
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
  parse(state: BlockState) {
    const line = state.currentLine;
    if (!line) return null;

    // matches 0-3 spaces starting with ``` or ~~~, followed by the info string
    const match = line.match(/^(\s{0,3})(`{3,}|~{3,})([^`]*)$/);
    if (!match) return null;

    const indent = match[1].length;
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
      if (nextLine.startsWith(' '.repeat(indent))) {
        contentLines.push(nextLine.slice(indent));
      } else {
        contentLines.push(nextLine);
      }
    }

    return {
      node: {
        type: 'code_block',
        lang,
        content: contentLines.join('\n'),
      },
      consumedLines,
    };
  },
};

/**
 * parse table |...| syntax
 */
export const tableRule: BlockRule = {
  name: 'table',
  parse(state: BlockState, ctx) {
    const line = state.currentLine;
    if (!line || !line.includes('|')) return null;

    // check if the second line is a line separator |---|---|
    if (state.lineIndex + 1 >= state.lineCount) return null;
    const nextLine = state.lines[state.lineIndex + 1];
    if (!/^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(nextLine))
      return null;

    let consumedLines = 2;
    // split header
 const extractCells = (row: string) => {
      const parts = row.split('|');
      if (parts[0] !== undefined && parts[0].trim() === '') parts.shift();
      if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop();
      return parts.map((s) => s.trim());
    };

        const headers = extractCells(line);
    const rows = [];
    
    // scan subsequent lines
    while (state.lineIndex + consumedLines < state.lineCount) {
      const rowLine = state.lines[state.lineIndex + consumedLines];
      // the table ends when a row without a | is encountered
      if (!rowLine.includes('|')) break;
      rows.push({
        type: 'table_row',
        children: extractCells(rowLine).map((cell) => ({
          type: 'table_cell',
          children: ctx.parseInline(cell),
        })),
      });
      consumedLines++;
    }

    return {
      node: {
        type: 'table',
        headers: headers.map((h) => ({
          type: 'table_cell',
          children: ctx.parseInline(h),
        })),
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

/**
 * parse list syntax (- xxx)
 */
export const listRule: BlockRule = {
  name: 'list',
  parse(state: BlockState, ctx) {
    const line = state.currentLine;
    if (!line) return null;

    // match list header: supports -, *, + and 1., 99)
    const match = line.match(/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)/);
    if (!match) return null;

    const baseIndent = match[1].length;
    const marker = match[2];
    const isOrdered = /\d/.test(marker);
    const startNumber = isOrdered ? parseInt(marker, 10) : undefined;

    const items: any[] = [];
    let consumedLines = 0;

    while (state.lineIndex + consumedLines < state.lineCount) {
      const currentLine = state.lines[state.lineIndex + consumedLines];
      const itemMatch = currentLine.match(/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)/);

      // to determine if an item is a new list item:
      // the indentation must be consistent with the baseline
      if (itemMatch && itemMatch[1].length === baseIndent) {
        let itemLines: string[] = [itemMatch[3]];
        let itemConsumedLines = 1;

        // detect subsequent lines belonging to this item
        // (lines with indentation deeper than the marker).
        const markerTotalWidth = baseIndent + marker.length + 1;

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
          if (nextIndent >= markerTotalWidth) {
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
