// @ffm/converter/src/index.browser.ts
import { format, type FormatOption } from '@ffm/formatter';
import {
  isTransparentColorInBrowser,
  parseColorInBrowser,
} from './color/browser';
import { parseHtmlInBrowser } from './parser/browser';
import { renderFlow } from './render';
import type { ColorResolver } from './type';

export * from './color/browser';
export * from './constant';
export * from './parser/browser';
export * from './render';
export * from './style';
export * from './type';

const browserColorResolver: ColorResolver = {
  parseColor: parseColorInBrowser,
  isTransparentColor: isTransparentColorInBrowser,
};

/** Convert an HTML fragment to formatted Fuyeor Flavored Markdown in browser environment. */
export function fromHTML(input: string, option?: FormatOption): string {
  if (typeof input !== 'string') throw new TypeError('Input must be a string');
  const nodes = parseHtmlInBrowser(input);
  const rendered = renderFlow(nodes, {}, browserColorResolver);
  const formatted = format(rendered, option);
  return formatted.replace(/^\n+|\n+$/gu, '');
}
