// @ffm/formatter/src/print/inline.ts
import type { ASTNode } from '@ffm/parser';
import { transformTextNode } from '#/transform';
import type { FormatOption } from '#/type';

function longestBacktickRun(content: string): number {
  let longest = 0;
  for (const match of content.matchAll(/`+/gu)) {
    longest = Math.max(longest, match[0].length);
  }
  return longest;
}

/** Print a list of inline AST nodes to canonical FFM inline string. */
export function printInlineNodes(
  nodes: readonly ASTNode[] | undefined,
  option: FormatOption | undefined,
  context: 'heading' | 'sentence' = 'sentence',
): string {
  if (!nodes || nodes.length === 0) return '';
  return nodes.map((node) => printInlineNode(node, option, context)).join('');
}

/** Print a single inline AST node while preserving protected tokens from typography transformations. */
export function printInlineNode(
  node: ASTNode,
  option: FormatOption | undefined,
  context: 'heading' | 'sentence' = 'sentence',
): string {
  const type = node.type;

  if (type === 'text') {
    const rawValue = node.value ?? '';
    return transformTextNode(rawValue, option, context);
  }

  if (type === 'bold') {
    return `**${printInlineNodes(node.content, option, context)}**`;
  }

  if (type === 'italic') {
    return `*${printInlineNodes(node.content, option, context)}*`;
  }

  if (type === 'underline') {
    return `__${printInlineNodes(node.content, option, context)}__`;
  }

  if (type === 'strike' || type === 'delete') {
    return `--${printInlineNodes(node.content, option, context)}--`;
  }

  if (type === 'code_inline' || type === 'inline_code') {
    const value = node.value ?? '';
    const fence = '`'.repeat(Math.max(1, longestBacktickRun(value) + 1));
    return `${fence}${value}${fence}`;
  }

  if (type === 'math_inline') {
    return `$${node.value ?? ''}$`;
  }

  if (type === 'link') {
    const label = printInlineNodes(node.content, option, context);
    return `[${label}](${node.url ?? ''})`;
  }

  if (type === 'image') {
    const alt = node.alt ?? node.value ?? '';
    return `![${alt}](${node.url ?? ''})`;
  }

  if (type === 'hardbreak') {
    return '\n';
  }

  if (type === 'emoji') {
    return (node.value as string) ?? '';
  }

  // Fallback for nested content or raw value
  if (node.content) {
    return printInlineNodes(node.content, option, context);
  }

  return (node.value as string) ?? '';
}
