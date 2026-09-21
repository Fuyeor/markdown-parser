// @fuyeor/markdown-parser/src/core/plain-text.ts
import type { ASTNode } from '../types';

/// Converts Markdown/FFM AST nodes into search-oriented plain text.
export function toPlainText(nodes: readonly ASTNode[]): string {
  return blockTextList(nodes).replace(/\n+$/u, '');
}

/// Converts one AST node without interpreting HTML or CSS content.
function blockText(node: ASTNode): string {
  switch (node.type) {
    case 'text':
    case 'inline_code':
    case 'color_code':
      return node.content ?? '';
    case 'code_block':
      return node.content ?? '';
    case 'heading':
    case 'paragraph':
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strike':
    case 'link':
    case 'table_cell':
      return inlineText(node.children ?? []);
    case 'blockquote':
    case 'list':
    case 'list_item':
    case 'slide':
    case 'slide_item':
    case 'accordion':
    case 'chain':
    case 'root':
      return blockTextList(node.children ?? []);
    case 'accordion_item':
      return joinTitleAndBody(node.title ?? [], node.children ?? []);
    case 'chain_item':
      return joinTitleAndBody(node.title ?? [], node.children ?? []);
    case 'table': {
      const header = node.headers === undefined ? '' : blockTextList(node.headers);
      const body = blockTextList(node.children ?? []);
      return header.length > 0 && body.length > 0
        ? `${header}\n${body}`
        : header || body;
    }
    case 'table_row':
      return joinNodes(node.children ?? []);
    case 'hardbreak':
      return '\n';
    case 'hr':
      return '';
    default:
      return blockTextList(node.children ?? []);
  }
}

/// Converts inline children without inserting formatting boundaries.
function inlineText(nodes: readonly ASTNode[]): string {
  return nodes.map(blockText).join('');
}

/// Converts block children with a stable newline boundary.
function blockTextList(nodes: readonly ASTNode[]): string {
  let output = '';
  for (const [index, node] of nodes.entries()) {
    if (index > 0 && output.length > 0 && !output.endsWith('\n')) output += '\n';
    output += blockText(node);
  }
  return output;
}

/// Joins an FFM item's title and body without exposing presentation metadata.
function joinTitleAndBody(
  title: readonly ASTNode[],
  body: readonly ASTNode[],
): string {
  const titleText = inlineText(title);
  const bodyText = blockTextList(body);
  return titleText.length > 0 && bodyText.length > 0
    ? `${titleText}\n${bodyText}`
    : titleText || bodyText;
}

/// Joins table cells with boundaries that preserve searchable word separation.
function joinNodes(nodes: readonly ASTNode[]): string {
  return nodes.map(blockText).join('\n');
}
