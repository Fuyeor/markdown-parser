// @fuyeor/html2ffm/src/index.ts
import { format } from '@fuyeor/markdown-formatter';
import { parseDocument } from 'htmlparser2';
import { renderFlow } from './render';
import type { ParsedDocument, ToFFMOptions } from './types';

export * from './color';
export * from './constants';
export * from './render';
export * from './style';
export * from './types';

/** Convert an HTML fragment into formatted Fuyeor Flavored Markdown. */
export function toFFM(input: string, options?: ToFFMOptions): string {
  if (typeof input !== 'string') throw new TypeError('Input must be a string');

  let document: ParsedDocument;
  try {
    document = parseDocument(input, {
      decodeEntities: true,
      lowerCaseAttributeNames: true,
      lowerCaseTags: true,
    });
  } catch (error) {
    throw new Error('Failed to parse HTML fragment', { cause: error });
  }

  const rendered = renderFlow(document.children, {});
  const formatted = format(rendered, options);
  return formatted.replace(/^\n+|\n+$/gu, '');
}
