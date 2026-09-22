// @ffm/converter/src/style.ts
import { isTransparentColorInNode, parseColorInNode } from './color/node';
import { cssLengthPattern } from './constant';
import type { ColorResolver, Mark, Style } from './type';

export const defaultNodeColorResolver: ColorResolver = {
  parseColor: parseColorInNode,
  isTransparentColor: isTransparentColorInNode,
};

export function parseFontSize(value: string): string | null {
  const normalized = value.trim().replace(/\s*!important\s*$/iu, '');
  return cssLengthPattern.test(normalized) ? normalized : null;
}

/** Parse inline style attribute declarations while extracting styles and typographic mark. */
export function parseStyleAttribute(
  value: string | undefined,
  colorResolver: ColorResolver = defaultNodeColorResolver,
): { style: Style; mark: Partial<Mark> } {
  if (!value) return { style: {}, mark: {} };
  const style: Style = {};
  const mark: Partial<Mark> = {};

  for (const declaration of value.split(';')) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;
    const property = declaration.slice(0, colonIndex).trim().toLowerCase();
    const propertyValue = declaration
      .slice(colonIndex + 1)
      .trim()
      .toLowerCase()
      .replace(/\s*!important\s*$/iu, '');

    if (property === 'color') {
      const color = colorResolver.parseColor(propertyValue);
      if (color !== null) style.color = color;
      else if (colorResolver.isTransparentColor(propertyValue))
        style.color = null;
    } else if (property === 'background-color' || property === 'background') {
      // supports background-color and background
      const background = colorResolver.parseColor(propertyValue);
      if (background !== null) style.background = background;
      else if (colorResolver.isTransparentColor(propertyValue))
        style.background = null;
    } else if (property === 'font-size') {
      const fontSize = parseFontSize(propertyValue);
      if (fontSize !== null) style.fontSize = fontSize;
    } else if (
      property === 'text-decoration' ||
      property === 'text-decoration-line'
    ) {
      if (propertyValue.includes('underline')) mark.underline = true;
      if (propertyValue.includes('line-through')) mark.strike = true;
    } else if (property === 'font-weight') {
      if (['bold', 'bolder', '700', '800', '900'].includes(propertyValue)) {
        mark.bold = true;
      }
    } else if (property === 'font-style') {
      if (propertyValue === 'italic' || propertyValue === 'oblique') {
        mark.italic = true;
      }
    }
  }

  return { style, mark };
}

export function mergeStyle(parent: Style, own: Style): Style {
  return { ...parent, ...own };
}

export function cloneStyle(style: Style): Style {
  return { ...style };
}

export function cloneMark(mark: Mark, patch: Partial<Mark>): Mark {
  return { ...mark, ...patch };
}

export function styleKey(style: Style): string {
  return `${style.color ?? ''}|${style.background ?? ''}|${style.fontSize ?? ''}`;
}

export function markKey(mark: Mark): string {
  return `${mark.bold ? '1' : '0'}${mark.italic ? '1' : '0'}${mark.underline ? '1' : '0'}${mark.strike ? '1' : '0'}|${mark.link ?? ''}`;
}

export function formatStyle(style: Style): string {
  const attributes: string[] = [];
  if (style.color) attributes.push(`color = ${style.color}`);
  if (style.background) attributes.push(`background = ${style.background}`);
  if (style.fontSize) attributes.push(`font = {size = ${style.fontSize}}`);
  return attributes.length > 0 ? `(${attributes.join(', ')})` : '';
}
