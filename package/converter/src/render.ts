// @ffm/converter/src/render.ts
import {
  blockElement,
  unsafeSchemePattern,
  droppedElement,
  emptyMark,
  headingPattern,
  safeSchemePattern,
} from './constant';
import {
  cloneMark,
  cloneStyle,
  defaultNodeColorResolver,
  formatStyle,
  markKey,
  mergeStyle,
  parseStyleAttribute,
  styleKey,
} from './style';
import type {
  ChildNode,
  ColorResolver,
  ElementNode,
  InlinePiece,
  Mark,
  Style,
  TableRow,
  TextNode,
} from './type';

export function isElement(node: ChildNode): node is ElementNode {
  return 'name' in node && 'attribs' in node && 'children' in node;
}

export function isTextNode(node: ChildNode): node is TextNode {
  return (
    'data' in node &&
    !('name' in node) &&
    (!('type' in node) || node.type === 'text')
  );
}

export function isDroppedElement(element: ElementNode): boolean {
  return droppedElement.has(element.name);
}

export function isBlockElement(element: ElementNode): boolean {
  if (blockElement.has(element.name)) return true;
  return element.children.some(
    (child) => isElement(child) && isBlockElement(child),
  );
}

export function escapeMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[*_]/gu, '\\$&')
    .replace(/^(#{1,6}\s+|>\s*|[-+]\s+)/gmu, '\\$1');
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

function applyTextMark(content: string, mark: Mark): string {
  let result = content;
  if (mark.bold && mark.italic) result = `***${result}***`;
  else if (mark.bold) result = `**${result}**`;
  else if (mark.italic) result = `*${result}*`;
  if (mark.strike) result = `--${result}--`;
  if (mark.underline) result = `__${result}__`;
  return result;
}

function samePieceFormatting(left: InlinePiece, right: InlinePiece): boolean {
  return (
    styleKey(left.style) === styleKey(right.style) &&
    markKey(left.mark) === markKey(right.mark) &&
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
        mark: { ...piece.mark },
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
        next.mark.link !== first.mark.link ||
        next.content.includes('\n') ||
        first.content.includes('\n')
      )
        break;
      group.push(next);
      index++;
    }
    const content = group
      .map((piece) => applyTextMark(piece.content, piece.mark))
      .join('');
    const marked = first.mark.link
      ? `[${content}](${first.mark.link})`
      : content;
    const style = formatStyle(first.style);
    result += style ? `[${marked}]${style}` : marked;
  }
  return result;
}

export function renderInlineNode(
  node: ChildNode,
  style: Style,
  mark: Mark,
  colorResolver: ColorResolver = defaultNodeColorResolver,
): InlinePiece[] {
  if (isTextNode(node)) {
    if (!node.data) return [];
    const escaped = escapeMarkdownText(node.data);
    return [{ content: escaped, style: cloneStyle(style), mark: { ...mark } }];
  }
  if (!isElement(node) || isDroppedElement(node)) return [];

  const { style: ownStyle, mark: ownMark } = parseStyleAttribute(
    node.attribs.style,
    colorResolver,
  );
  const nextStyle = mergeStyle(style, ownStyle);
  let nextMark = cloneMark(mark, ownMark);

  const name = node.name;
  if (name === 'br') {
    return [
      { content: '\n', style: cloneStyle(nextStyle), mark: { ...nextMark } },
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
        mark: { ...mark },
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
        mark: { ...nextMark },
      },
    ];
  }

  if (name === 'strong' || name === 'b')
    nextMark = cloneMark(nextMark, { bold: true });
  else if (name === 'em' || name === 'i')
    nextMark = cloneMark(nextMark, { italic: true });
  else if (name === 'u' || name === 'ins')
    nextMark = cloneMark(nextMark, { underline: true });
  else if (name === 's' || name === 'del' || name === 'strike')
    nextMark = cloneMark(nextMark, { strike: true });

  if (name === 'a') {
    const href = node.attribs.href;
    const normalizedHref = href?.trim();
    const hasScheme = normalizedHref
      ? /^[a-z][a-z\d+.-]*:/iu.test(normalizedHref)
      : false;
    const isSafeUrl =
      normalizedHref !== undefined &&
      normalizedHref !== '' &&
      !unsafeSchemePattern.test(normalizedHref) &&
      (!hasScheme || safeSchemePattern.test(normalizedHref));
    if (isSafeUrl) nextMark = cloneMark(nextMark, { link: href });
  }

  const pieces: InlinePiece[] = [];
  for (const child of node.children) {
    pieces.push(...renderInlineNode(child, nextStyle, nextMark, colorResolver));
  }
  return pieces;
}

export function renderInlineContent(
  nodes: readonly ChildNode[],
  style: Style,
  mark: Mark,
  colorResolver: ColorResolver = defaultNodeColorResolver,
): string {
  const pieces: InlinePiece[] = [];
  for (const node of nodes) {
    if (isTextNode(node)) {
      if (/^\s+$/u.test(node.data) && node.data.includes('\n')) continue;
      pieces.push(...renderInlineNode(node, style, mark, colorResolver));
    } else if (isElement(node) && !isBlockElement(node)) {
      pieces.push(...renderInlineNode(node, style, mark, colorResolver));
    }
  }
  return serializePieces(pieces);
}

// Render ordered and unordered lists with canonical two-space nesting.
export function renderList(
  element: ElementNode,
  style: Style,
  depth: number,
  colorResolver: ColorResolver = defaultNodeColorResolver,
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

    // Extract the list item content
    // split it into multiple lines based on line breaks
    // and add 2 spaces of FFM standard indentation
    const rawContent = stripBoundaryNewlines(
      renderFlow(inlineChildren, style, colorResolver),
    ).trim();

    const marker = ordered ? `${number}.` : '-';
    number++;
    const currentIndent = '  '.repeat(depth);
    const subIndent = '  '.repeat(depth + 1);

    if (rawContent) {
      const contentLines = rawContent
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (contentLines.length > 0) {
        const firstLine = `${currentIndent}${marker} ${contentLines[0]}`;
        const restLines = contentLines
          .slice(1)
          .map((line) => `${subIndent}${line}`);
        lines.push([firstLine, ...restLines].join('\n'));
      }
    } else {
      lines.push(`${currentIndent}${marker}`);
    }

    for (const nestedList of nestedLists) {
      const nested = renderList(
        nestedList,
        style,
        depth + 1,
        colorResolver,
      ).replace(/\n+$/u, '');
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

export function renderTable(
  element: ElementNode,
  style: Style,
  colorResolver: ColorResolver = defaultNodeColorResolver,
): string {
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
      return renderFlow(cell.children, style, colorResolver)
        .replace(/\s+/gu, ' ')
        .trim();
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

export function renderBlockElement(
  element: ElementNode,
  style: Style,
  colorResolver: ColorResolver = defaultNodeColorResolver,
): string {
  if (isDroppedElement(element)) return '';
  const { style: ownStyle } = parseStyleAttribute(
    element.attribs.style,
    colorResolver,
  );
  const nextStyle = mergeStyle(style, ownStyle);
  if (element.name === 'hr') return '---\n\n';
  if (element.name === 'pre') return renderPre(element);
  if (element.name === 'ul' || element.name === 'ol')
    return renderList(element, nextStyle, 0, colorResolver);
  if (element.name === 'li') {
    const content = stripBoundaryNewlines(
      renderFlow(element.children, nextStyle, colorResolver),
    ).trim();
    return content ? `- ${content}\n\n` : '';
  }
  if (element.name === 'table')
    return renderTable(element, nextStyle, colorResolver);
  if (element.name === 'blockquote') {
    const rawContent = stripBoundaryNewlines(
      renderFlow(element.children, nextStyle, colorResolver),
    ).trim();
    if (!rawContent) return '';
    const textLines = rawContent.split(/\n+/u);
    if (textLines.length >= 3) {
      return `\`\`\`quote\n${rawContent}\n\`\`\`\n\n`;
    }
    const quoted = rawContent
      .split('\n')
      .map((line) => (line ? `> ${line}` : '>'))
      .join('\n');
    return `${quoted}\n\n`;
  }

  const headingMatch = element.name.match(headingPattern);
  if (headingMatch) {
    const content = renderInlineContent(
      element.children,
      nextStyle,
      emptyMark,
      colorResolver,
    ).trim();
    return content
      ? `${'#'.repeat(Number(headingMatch[1]))} ${content}\n\n`
      : '';
  }

  // Remove simple line breaks at the beginning and end
  // retaining the line breaks intentionally left by the author within the paragraph
  const content = renderFlow(element.children, nextStyle, colorResolver)
    .replace(/^\n+/u, '')
    .replace(/[ \t]+$/u, '');

  // Empty `<p></p>` paragraphs retain line breaks and whitespace;
  // empty `<div></div>` containers are ignored
  if (!content.trim()) {
    return element.name === 'p' ? '\n\n' : '';
  }

  // If the content itself already has block delimiters (ending with \n\n), do not append again;
  // otherwise, normalize and pad to \n\n  if (content.endsWith('\n\n')) return content;
  if (content.endsWith('\n')) return `${content}\n`;
  return `${content}\n\n`;
}

export function renderFlow(
  nodes: readonly ChildNode[],
  style: Style,
  colorResolver: ColorResolver = defaultNodeColorResolver,
): string {
  let output = '';
  let inlinePieces: InlinePiece[] = [];
  const flushInline = () => {
    if (inlinePieces.length === 0) return;
    output += serializePieces(inlinePieces);
    inlinePieces = [];
  };

  for (const node of nodes) {
    if (isTextNode(node)) {
      // If the text node contains consecutive line breaks (\n\n)
      // Then preserving the line breaks
      if (/^\s*?\n\s*?\n\s*?$/u.test(node.data)) {
        flushInline();
        if (output && !output.endsWith('\n\n')) {
          output += output.endsWith('\n') ? '\n' : '\n\n';
        }
        continue;
      }
      // Filter single line breaks and indentation for dirty data
      if (/^\s+$/u.test(node.data) && node.data.includes('\n')) continue;

      // If a block-level \n\n delimiter already exists
      // truncate all newline characters (\n+) at the beginning of the current text
      let textData = node.data;
      if (inlinePieces.length === 0 && (!output || output.endsWith('\n\n'))) {
        textData = textData.replace(/^\n+/u, '');
      }

      if (!textData) continue;

      inlinePieces.push(
        ...renderInlineNode(
          { ...node, data: textData } as TextNode,
          style,
          emptyMark,
          colorResolver,
        ),
      );
      continue;
    }
    if (!isElement(node) || isDroppedElement(node)) continue;
    if (isBlockElement(node)) {
      flushInline();
      // Ensure a standard block-level line break (\n\n)
      // between inline elements and subsequent block-level elements
      if (output && !output.endsWith('\n\n')) {
        output += output.endsWith('\n') ? '\n' : '\n\n';
      }
      output += renderBlockElement(node, style, colorResolver);
    } else {
      inlinePieces.push(
        ...renderInlineNode(node, style, emptyMark, colorResolver),
      );
    }
  }
  flushInline();
  return output;
}
