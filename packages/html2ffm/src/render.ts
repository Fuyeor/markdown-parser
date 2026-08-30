// @fuyeor/html2ffm/src/render.ts
import {
  BLOCK_TAGS,
  DANGEROUS_URL_PATTERN,
  DROPPED_TAGS,
  EMPTY_MARKS,
  HEADING_PATTERN,
  SAFE_SCHEME_PATTERN,
} from './constants';
import {
  cloneMarks,
  cloneStyle,
  formatStyle,
  marksKey,
  mergeStyle,
  parseStyleAttribute,
  styleKey,
} from './style';
import type {
  ChildNode,
  ElementNode,
  InlinePiece,
  Marks,
  Style,
  TableRow,
  TextNode,
} from './types';

export function isElement(node: ChildNode): node is ElementNode {
  return 'name' in node && 'attribs' in node && 'children' in node;
}

export function isTextNode(node: ChildNode): node is TextNode {
  return 'data' in node && !('name' in node);
}

export function isDroppedElement(element: ElementNode): boolean {
  return DROPPED_TAGS.has(element.name);
}

export function isBlockElement(element: ElementNode): boolean {
  if (BLOCK_TAGS.has(element.name)) return true;
  return element.children.some(
    (child) => isElement(child) && isBlockElement(child),
  );
}

export function escapeMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[*_]/gu, '\\$&')
    .replace(/^(#{1,6}\s+|>\s*|[-+*]\s+|\d+\.\s+)/gmu, '\\$1');
}

function getTextContent(nodes: readonly ChildNode[]): string {
  let result = '';
  for (const node of nodes) {
    if (isTextNode(node)) result += node.data;
    else if (isElement(node) && !isDroppedElement(node))
      result += getTextContent(node.children);
  }
  return result;
}

function getPreTextContent(nodes: readonly ChildNode[]): string {
  let result = '';
  for (const node of nodes) {
    if (isTextNode(node)) result += node.data;
    else if (isElement(node) && !isDroppedElement(node))
      result += node.name === 'br' ? '\n' : getPreTextContent(node.children);
  }
  return result;
}

function longestBacktickRun(content: string): number {
  let longest = 0;
  for (const match of content.matchAll(/`+/gu)) {
    longest = Math.max(longest, match[0].length);
  }
  return longest;
}

function stripBoundaryNewlines(content: string): string {
  return content.replace(/^\n+/u, '').replace(/\n+$/u, '');
}

function applyTextMarks(content: string, marks: Marks): string {
  let result = content;
  if (marks.bold && marks.italic) result = `***${result}***`;
  else if (marks.bold) result = `**${result}**`;
  else if (marks.italic) result = `*${result}*`;
  if (marks.strike) result = `--${result}--`;
  if (marks.underline) result = `__${result}__`;
  return result;
}

function samePieceFormatting(left: InlinePiece, right: InlinePiece): boolean {
  return (
    styleKey(left.style) === styleKey(right.style) &&
    marksKey(left.marks) === marksKey(right.marks) &&
    !left.content.includes('\n') &&
    !right.content.includes('\n')
  );
}

export function serializePieces(pieces: readonly InlinePiece[]): string {
  const merged: InlinePiece[] = [];
  for (const piece of pieces) {
    if (!piece.content) continue;
    const previous = merged.at(-1);
    if (previous && samePieceFormatting(previous, piece)) {
      previous.content += piece.content;
    } else {
      merged.push({
        content: piece.content,
        style: cloneStyle(piece.style),
        marks: { ...piece.marks },
      });
    }
  }

  let result = '';
  for (let index = 0; index < merged.length; ) {
    const first = merged[index]!;
    const group = [first];
    index++;
    while (index < merged.length) {
      const next = merged[index]!;
      if (
        styleKey(next.style) !== styleKey(first.style) ||
        next.marks.link !== first.marks.link ||
        next.content.includes('\n') ||
        first.content.includes('\n')
      )
        break;
      group.push(next);
      index++;
    }
    const content = group
      .map((piece) => applyTextMarks(piece.content, piece.marks))
      .join('');
    const marked = first.marks.link
      ? `[${content}](${first.marks.link})`
      : content;
    const style = formatStyle(first.style);
    result += style ? `[${marked}]${style}` : marked;
  }
  return result;
}

export function renderInlineNode(
  node: ChildNode,
  style: Style,
  marks: Marks,
): InlinePiece[] {
  if (isTextNode(node)) {
    if (!node.data) return [];
    // escape text node
    const escaped = escapeMarkdownText(node.data);
    return [
      { content: escaped, style: cloneStyle(style), marks: { ...marks } },
    ];
  }
  if (!isElement(node) || isDroppedElement(node)) return [];

  const { style: ownStyle, marks: ownMarks } = parseStyleAttribute(
    node.attribs.style,
  );
  const nextStyle = mergeStyle(style, ownStyle);
  let nextMarks = cloneMarks(marks, ownMarks);

  const name = node.name;
  if (name === 'br') {
    return [
      { content: '\n', style: cloneStyle(nextStyle), marks: { ...nextMarks } },
    ];
  }
  if (name === 'img') {
    const source = node.attribs.src;
    if (!source) return [];
    const alt = node.attribs.alt ?? '';
    return [
      {
        content: `![${alt}](${source})`,
        style: cloneStyle(nextStyle),
        marks: { ...nextMarks },
      },
    ];
  }
  if (name === 'code') {
    const code = getTextContent(node.children);
    if (!code) return [];
    const fence = '`'.repeat(Math.max(1, longestBacktickRun(code) + 1));
    return [
      {
        content: `${fence}${code}${fence}`,
        style: cloneStyle(nextStyle),
        marks: {
          ...nextMarks,
          bold: false,
          italic: false,
          underline: false,
          strike: false,
        },
      },
    ];
  }

  if (name === 'strong' || name === 'b')
    nextMarks = cloneMarks(nextMarks, { bold: true });
  else if (name === 'em' || name === 'i')
    nextMarks = cloneMarks(nextMarks, { italic: true });
  else if (name === 'u' || name === 'ins')
    nextMarks = cloneMarks(nextMarks, { underline: true });
  else if (name === 's' || name === 'del' || name === 'strike')
    nextMarks = cloneMarks(nextMarks, { strike: true });

  if (name === 'a') {
    const href = node.attribs.href;
    const normalizedHref = href?.trim();
    const hasScheme = normalizedHref
      ? /^[a-z][a-z\d+.-]*:/iu.test(normalizedHref)
      : false;
    const isSafeUrl =
      normalizedHref !== undefined &&
      normalizedHref !== '' &&
      !DANGEROUS_URL_PATTERN.test(normalizedHref) &&
      (!hasScheme || SAFE_SCHEME_PATTERN.test(normalizedHref));
    if (isSafeUrl) nextMarks = cloneMarks(nextMarks, { link: href });
  }

  const pieces: InlinePiece[] = [];
  for (const child of node.children) {
    pieces.push(...renderInlineNode(child, nextStyle, nextMarks));
  }
  return pieces;
}

export function renderInlineContent(
  nodes: readonly ChildNode[],
  style: Style,
  marks: Marks,
): string {
  const pieces: InlinePiece[] = [];
  for (const node of nodes) {
    if (isTextNode(node)) {
      if (/^\s+$/u.test(node.data) && node.data.includes('\n')) continue;
      pieces.push(...renderInlineNode(node, style, marks));
    } else if (isElement(node) && !isBlockElement(node)) {
      pieces.push(...renderInlineNode(node, style, marks));
    }
  }
  return serializePieces(pieces);
}

export function renderList(
  element: ElementNode,
  style: Style,
  depth: number,
): string {
  const ordered = element.name === 'ol';
  const parsedStart = Number.parseInt(element.attribs.start ?? '', 10);
  let number = Number.isInteger(parsedStart) ? parsedStart : 1;
  const lines: string[] = [];
  for (const child of element.children) {
    if (!isElement(child) || child.name !== 'li') continue;
    const inlineChildren: ChildNode[] = [];
    const nestedLists: ElementNode[] = [];
    for (const itemChild of child.children) {
      if (
        isElement(itemChild) &&
        (itemChild.name === 'ul' || itemChild.name === 'ol')
      )
        nestedLists.push(itemChild);
      else inlineChildren.push(itemChild);
    }
    const itemContent = renderFlow(inlineChildren, style)
      .replace(/\n+/gu, ' ')
      .trim();
    const marker = ordered ? `${number}.` : '-';
    number++;
    lines.push(
      `${'  '.repeat(depth)}${marker}${itemContent ? ` ${itemContent}` : ''}`,
    );
    for (const nestedList of nestedLists) {
      const nested = renderList(nestedList, style, depth + 1).replace(
        /\n+$/u,
        '',
      );
      if (nested) lines.push(nested);
    }
  }
  return lines.length > 0 ? `${lines.join('\n')}\n\n` : '';
}

function getTableRows(element: ElementNode): TableRow[] {
  const rows: TableRow[] = [];
  const visit = (node: ElementNode, insideHead: boolean) => {
    if (node.name === 'table' && node !== element) return;
    const nextInsideHead = insideHead || node.name === 'thead';
    if (node.name === 'tr') {
      rows.push({
        cells: node.children.filter(
          (child): child is ElementNode =>
            isElement(child) && (child.name === 'th' || child.name === 'td'),
        ),
        isHeader:
          nextInsideHead ||
          node.children.some(
            (child) => isElement(child) && child.name === 'th',
          ),
      });
      return;
    }
    for (const child of node.children) {
      if (isElement(child)) visit(child, nextInsideHead);
    }
  };
  visit(element, false);
  return rows;
}

export function renderTable(element: ElementNode, style: Style): string {
  const rows = getTableRows(element);
  if (rows.length === 0) return '';
  const headerIndex = rows.findIndex((row) => row.isHeader);
  const hasHeader = headerIndex !== -1;
  const header = hasHeader ? rows[headerIndex]!.cells : null;
  const dataRows = hasHeader
    ? rows.filter((_row, index) => index !== headerIndex)
    : rows;
  const columnCount = Math.max(1, ...rows.map((row) => row.cells.length));
  const renderRow = (row: readonly ElementNode[]): string => {
    const cells = Array.from({ length: columnCount }, (_value, index) => {
      const cell = row[index];
      if (!cell) return '';
      return renderFlow(cell.children, style).replace(/\s+/gu, ' ').trim();
    });
    return `| ${cells.join(' | ')} |`;
  };
  const lines: string[] = [];
  if (header) lines.push(renderRow(header));
  lines.push(
    `| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |`,
  );
  lines.push(...dataRows.map((row) => renderRow(row.cells)));
  return `${lines.join('\n')}\n\n`;
}

export function renderPre(element: ElementNode): string {
  const content = getPreTextContent(element.children);
  if (!content) return '';
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(content) + 1));
  const body = content.endsWith('\n') ? content : `${content}\n`;
  return `${fence}\n${body}${fence}\n\n`;
}

export function renderBlockElement(element: ElementNode, style: Style): string {
  if (isDroppedElement(element)) return '';
  const { style: ownStyle } = parseStyleAttribute(element.attribs.style);
  const nextStyle = mergeStyle(style, ownStyle);
  if (element.name === 'hr') return '\n\n---\n\n';
  if (element.name === 'pre') return renderPre(element);
  if (element.name === 'ul' || element.name === 'ol')
    return renderList(element, nextStyle, 0);
  if (element.name === 'table') return renderTable(element, nextStyle);
  if (element.name === 'blockquote') {
    // ✨ 规范化空行（保留最多双换行段落结构）
    const rawContent = stripBoundaryNewlines(
      renderFlow(element.children, nextStyle),
    )
      .replace(/\n{3,}/gu, '\n\n')
      .trim();
    if (!rawContent) return '';
    const textLines = rawContent.split(/\n+/u);
    if (textLines.length >= 3) {
      return `\`\`\`quote\n${rawContent}\n\`\`\`\n\n`; // ✨ 完整保留段落原本的换行结构
    }
    const quoted = rawContent
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n');
    return `${quoted}\n\n`;
  }

  const headingMatch = element.name.match(HEADING_PATTERN);
  if (headingMatch) {
    const content = renderInlineContent(
      element.children,
      nextStyle,
      EMPTY_MARKS,
    ).trim();
    return content
      ? `${'#'.repeat(Number(headingMatch[1]))} ${content}\n\n`
      : '';
  }

  const content = stripBoundaryNewlines(
    renderFlow(element.children, nextStyle),
  ).trim();
  return content ? `${content}\n\n` : '';
}

export function renderFlow(nodes: readonly ChildNode[], style: Style): string {
  let output = '';
  let inlinePieces: InlinePiece[] = [];
  const flushInline = () => {
    if (inlinePieces.length === 0) return;
    output += serializePieces(inlinePieces);
    inlinePieces = [];
  };

  for (const node of nodes) {
    if (isTextNode(node)) {
      if (/^\s+$/u.test(node.data) && node.data.includes('\n')) continue;
      inlinePieces.push(...renderInlineNode(node, style, EMPTY_MARKS));
      continue;
    }
    if (!isElement(node) || isDroppedElement(node)) continue;
    if (isBlockElement(node)) {
      flushInline();
      output += renderBlockElement(node, style);
    } else {
      inlinePieces.push(...renderInlineNode(node, style, EMPTY_MARKS));
    }
  }
  flushInline();
  return output;
}
