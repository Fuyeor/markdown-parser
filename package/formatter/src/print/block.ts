// @ffm/formatter/src/print/block.ts
import type { ASTNode } from '@ffm/parser';
import { printInlineNode, printInlineNodes } from './inline';
import type { FormatOption } from '#/type';

function longestBacktickRun(content: string): number {
  let longest = 0;
  for (const match of content.matchAll(/`+/gu)) {
    longest = Math.max(longest, match[0].length);
  }
  return longest;
}

/** Print preformatted code or semantic fence blocks with sufficient delimiter length. */
export function printCodeBlock(node: ASTNode): string {
  const content = (node.value as string) ?? '';
  const lang = (node.lang as string) ?? '';
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(content) + 1));
  const body = content.endsWith('\n') ? content : `${content}\n`;
  return `${fence}${lang}\n${body}${fence}`;
}

/** Print ordered and unordered lists with standard 2-space indentation depth. */
export function printList(
  node: ASTNode,
  option: FormatOption | undefined,
  depth = 0,
): string {
  const ordered = Boolean(node.ordered);
  let startNumber = typeof node.start === 'number' ? node.start : 1;
  const items = node.content ?? [];
  const lines: string[] = [];

  for (const item of items) {
    const indent = '  '.repeat(depth);
    const subIndent = '  '.repeat(depth + 1);
    const marker = ordered ? `${startNumber}.` : '-';
    startNumber++;

    const array = item.content ?? [];
    const directInlines: ASTNode[] = [];
    const childBlocks: ASTNode[] = [];

    for (const item of array) {
      if (item.type === 'list') {
        childBlocks.push(item);
      } else if (item.type === 'paragraph') {
        directInlines.push(...(item.content ?? []));
      } else {
        directInlines.push(item);
      }
    }

    const checkbox = item.hasCheckbox
      ? item.isCompleted
        ? '[x] '
        : '[ ] '
      : '';

    const textOutput = printInlineNodes(
      directInlines,
      option,
      'sentence',
    ).trim();
    const rawLines = textOutput.split('\n').filter(Boolean);

    if (rawLines.length > 0) {
      const firstLine = `${indent}${marker} ${checkbox}${rawLines[0]}`;
      const restLines = rawLines.slice(1).map((line) => `${subIndent}${line}`);
      lines.push([firstLine, ...restLines].join('\n'));
    } else {
      lines.push(`${indent}${marker} ${checkbox}`.trimEnd());
    }

    for (const childList of childBlocks) {
      lines.push(printList(childList, option, depth + 1));
    }
  }

  return lines.join('\n');
}

/** Print table node into canonical pipe table notation. */
export function printTable(
  node: ASTNode,
  option: FormatOption | undefined,
): string {
  const headers = node.header ?? [];
  const rows = node.content ?? [];
  const allRows: ASTNode[][] = [];

  if (headers.length > 0) {
    allRows.push(headers);
  }
  for (const row of rows) {
    allRows.push(row.content ?? []);
  }

  if (allRows.length === 0) return '';

  const colCount = Math.max(1, ...allRows.map((r) => r.length));
  const renderCell = (cell: ASTNode | undefined): string => {
    if (!cell) return '';
    if (cell.content) {
      return printInlineNodes(cell.content, option, 'sentence')
        .replace(/\s+/gu, ' ')
        .trim();
    }
    return String(cell.value ?? '')
      .replace(/\s+/gu, ' ')
      .trim();
  };

  const lines: string[] = [];
  if (headers.length > 0) {
    lines.push(`| ${headers.map((h) => renderCell(h)).join(' | ')} |`);
  }
  lines.push(
    `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`,
  );

  for (const row of rows) {
    const cells = row.content ?? [];
    const rendered = Array.from({ length: colCount }, (_value, index) =>
      renderCell(cells[index]),
    );
    lines.push(`| ${rendered.join(' | ')} |`);
  }

  return lines.join('\n');
}

/** Print a single block AST node into standard FFM block representation. */
export function printBlockNode(
  node: ASTNode,
  option: FormatOption | undefined,
): string {
  const type = node.type;

  if (type === 'heading') {
    const level = Math.max(1, Math.min(6, node.level ?? 1));
    const content = printInlineNodes(node.content, option, 'heading');
    return `${'#'.repeat(level)} ${content}`;
  }

  if (type === 'paragraph') {
    return printInlineNodes(node.content, option, 'sentence');
  }

  if (type === 'blockquote') {
    // Recursively print block-level paragraphs within the blockquote
    const innerBlocks = (node.content ?? [])
      .map((c) => printBlockNode(c, option))
      .filter(Boolean);
    const body = innerBlocks.join('\n\n').trim();
    const lines = body.split('\n');
    if (lines.length >= 3) {
      return `\`\`\`quote\n${body}\n\`\`\``;
    }
    return lines.map((l) => (l ? `> ${l}` : '>')).join('\n');
  }

  if (type === 'code_block' || type === 'code') {
    return printCodeBlock(node);
  }

  if (type === 'math_block') {
    return `$$\n${(node.value as string) ?? ''}\n$$`;
  }

  if (type === 'list') {
    return printList(node, option, 0);
  }

  if (type === 'table') {
    return printTable(node, option);
  }

  if (type === 'hr') {
    return '---';
  }

  if (type === 'mermaid' || type === 'abc' || type === 'smiles_block') {
    const content = (node.value as string) ?? '';
    return `\`\`\`${type}\n${content.endsWith('\n') ? content : `${content}\n`}\`\`\``;
  }

  if (node.content && node.content.length > 0) {
    return node.content.map((c) => printBlockNode(c, option)).join('\n\n');
  }

  return printInlineNode(node, option, 'sentence');
}
