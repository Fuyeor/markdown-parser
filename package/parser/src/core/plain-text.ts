// @ffm/parser/src/core/plain-text.ts
import type { ASTNode } from '#/type';

/// Converts Markdown/FFM AST node into search-oriented plain text.
export function toPlainText(node: readonly ASTNode[]): string {
  return blockTextList(node).replace(/\n+$/u, '');
}

/// Converts one AST node without interpreting HTML or CSS content.
function blockText(node: ASTNode): string {
  switch (node.type) {
    case 'text':
    case 'inline_code':
    case 'color_code':
      return node.value ?? '';
    case 'code_block':
      return node.value ?? '';
    case 'heading':
    case 'paragraph':
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strike':
    case 'link':
    case 'table_cell':
      return inlineText(node.content ?? []);
    case 'blockquote':
    case 'list':
    case 'list_item':
    case 'slide':
    case 'slide_item':
    case 'accordion':
    case 'chain':
    case 'root':
      return blockTextList(node.content ?? []);
    case 'accordion_item':
      return joinTitleAndBody(node.title ?? [], node.content ?? []);
    case 'chain_item':
      return joinTitleAndBody(node.title ?? [], node.content ?? []);
    case 'table': {
      const header =
        node.header === undefined ? '' : blockTextList(node.header);
      const body = blockTextList(node.content ?? []);
      return header.length > 0 && body.length > 0
        ? `${header}\n${body}`
        : header || body;
    }
    case 'table_row':
      return joinNodes(node.content ?? []);
    case 'hardbreak':
      return '\n';
    case 'hr':
      return '';
    default:
      return blockTextList(node.content ?? []);
  }
}

/// Converts inline children without inserting formatting boundaries.
function inlineText(node: readonly ASTNode[]): string {
  return node.map(blockText).join('');
}

/// Converts block children with a stable newline boundary.
function blockTextList(nodes: readonly ASTNode[]): string {
  let output = '';
  for (const [index, node] of nodes.entries()) {
    if (index > 0 && output.length > 0 && !output.endsWith('\n'))
      output += '\n';
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
function joinNodes(node: readonly ASTNode[]): string {
  return node.map(blockText).join('\n');
}
