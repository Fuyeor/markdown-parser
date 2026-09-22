// @ffm/converter/src/parser/browser.ts
import type { ChildNode, ElementNode, TextNode } from '#/type';

function domNodeToAst(node: Node): ChildNode | null {
  if (node.nodeType === 3) {
    return { data: node.nodeValue ?? '' } as TextNode;
  }
  if (node.nodeType === 1) {
    const element = node as Element;
    const attribs: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      attribs[attr.name.toLowerCase()] = attr.value;
    }
    const children: ChildNode[] = [];
    for (const item of Array.from(element.childNodes)) {
      const astChild = domNodeToAst(item);
      if (astChild) children.push(astChild);
    }
    return {
      name: element.nodeName.toLowerCase(),
      attribs,
      children,
    } as ElementNode;
  }
  return null;
}

/** Parse an HTML fragment into unified AST child nodes using browser native DOMParser. */
export function parseHtmlInBrowser(html: string): ChildNode[] {
  const parser = new window.DOMParser();
  const _document = parser.parseFromString(html, 'text/html');
  const nodes: ChildNode[] = [];
  for (const child of Array.from(_document.body.childNodes)) {
    const astNode = domNodeToAst(child);
    if (astNode) nodes.push(astNode);
  }
  return nodes;
}
