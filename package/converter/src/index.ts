// @ffm/converter/src/index.ts
import { format } from '@ffm/formatter';
import { parseDocument } from 'htmlparser2';
import { renderFlow } from './render';
import type { ParsedDocument, ToFFMOptions } from './type';

export * from './color';
export * from './constant';
export * from './render';
export * from './style';
export * from './type';

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
