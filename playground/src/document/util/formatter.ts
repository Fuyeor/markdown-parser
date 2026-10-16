// @/document/util/formatter.ts

// prettier-ignore
const voidElement = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'source', 'track', 'wbr',
]);

const preElement = new Set(['pre', 'textarea']);

// prettier-ignore
const inlineElement = new Set([
  'a', 'b', 'code', 'em', 'i', 's', 'small', 'span', 'strong', 'sub', 'sup',
]);

function isInlineOnly(element: Element): boolean {
  for (const child of element.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = (child as Element).tagName.toLowerCase();
      if (!inlineElement.has(tag)) return false;
    }
  }
  return true;
}

function serializeNode(node: Node, depth = 0): string {
  const indent = '  '.repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim() ?? '';
    return text ? `${indent}${text}\n` : '';
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    const attrs = element
      .getAttributeNames()
      .map((name) => ` ${name}="${element.getAttribute(name)}"`)
      .join('');

    if (voidElement.has(tag)) return `${indent}<${tag}${attrs}>\n`;
    if (preElement.has(tag))
      return `${indent}<${tag}${attrs}>${element.innerHTML}</${tag}>\n`;

    if (isInlineOnly(element)) {
      return `${indent}<${tag}${attrs}>${element.innerHTML.trim()}</${tag}>\n`;
    }

    let inner = '';
    for (const child of element.childNodes) {
      inner += serializeNode(child, depth + 1);
    }

    return `${indent}<${tag}${attrs}>\n${inner}${indent}</${tag}>\n`;
  }

  return '';
}

/**
 * format HTML using <template>
 */
export function formatHtml(rawHtml: string): string {
  if (!rawHtml.trim()) return '';

  const template = window.document.createElement('template');
  template.innerHTML = rawHtml.trim();

  let formatted = '';
  for (const child of template.content.childNodes) {
    formatted += serializeNode(child, 0);
  }

  return formatted.trim();
}
