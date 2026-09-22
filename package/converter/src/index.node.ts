// @ffm/converter/src/index.node.ts
import { format, type FormatOption } from '@ffm/formatter';
import { defaultNodeColorResolver } from './style';
import { parseHtmlInNode } from './parser/node';
import { renderFlow } from './render';

export * from './color/node';
export * from './constant';
export * from './parser/node';
export * from './render';
export * from './style';
export * from './type';

/** Convert an HTML fragment to formatted Fuyeor Flavored Markdown in Node environments. */
export function fromHTML(input: string, option?: FormatOption): string {
  if (typeof input !== 'string') throw new TypeError('Input must be a string');
  const nodes = parseHtmlInNode(input);
  const rendered = renderFlow(nodes, {}, defaultNodeColorResolver);
  const formatted = format(rendered, option);
  return formatted.replace(/^\n+|\n+$/gu, '');
}
