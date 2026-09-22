// @ffm/converter/src/constant.ts
import type { Mark } from './type';

export const blockElement = new Set([
  'article',
  'aside',
  'blockquote',
  'div',
  'footer',
  'header',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
]);

export const droppedElement = new Set([
  'math',
  'script',
  'style',
  'svg',
  'template',
]);
export const headingPattern = /^h([1-6])$/u;
export const cssLengthPattern =
  /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|%|pt|pc|in|cm|mm|q|ch|ex|cap|ic|lh|rlh|vw|vh|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|vi|vb)$/iu;
export const safeSchemePattern = /^(?:https?:|mailto:|tel:|ftp:)/iu;
export const unsafeSchemePattern = /^(?:javascript:|data:|vbscript:|file:)/iu;

export const emptyMark: Mark = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
};
