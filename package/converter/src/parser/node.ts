// @ffm/converter/src/parser/node.ts
import { parseDocument } from 'htmlparser2';
import type { ChildNode } from '#/type';

/** Parse an HTML fragment into unified AST child nodes using htmlparser2. */
export function parseHtmlInNode(html: string): ChildNode[] {
  const _document = parseDocument(html, {
    decodeEntities: true,
    lowerCaseAttributeNames: true,
    lowerCaseTags: true,
  });
  return _document.children as ChildNode[];
}
