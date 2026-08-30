// @fuyeor/html2ffm/src/style.ts
import { isTransparentColor, parseColor } from './color';
import { CSS_LENGTH_PATTERN } from './constants';
import type { Marks, Style } from './types';

export function parseFontSize(value: string): string | null {
  const normalized = value.trim().replace(/\s*!important\s*$/iu, '');
  return CSS_LENGTH_PATTERN.test(normalized) ? normalized : null;
}

// Parse supported inline declarations while preserving CSS last-valid semantics.
export function parseStyleAttribute(value: string | undefined): {
  style: Style;
  marks: Partial<Marks>;
} {
  if (!value) return { style: {}, marks: {} };
  const style: Style = {};
  const marks: Partial<Marks> = {};

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
      const color = parseColor(propertyValue);
      if (color !== null) style.color = color;
      else if (isTransparentColor(propertyValue)) style.color = null;
    } else if (property === 'background-color' || property === 'background') {
      // supports background-color and background
      const background = parseColor(propertyValue);
      if (background !== null) style.background = background;
      else if (isTransparentColor(propertyValue)) style.background = null;
    } else if (property === 'font-size') {
      const fontSize = parseFontSize(propertyValue);
      if (fontSize !== null) style.fontSize = fontSize;
    } else if (
      property === 'text-decoration' ||
      property === 'text-decoration-line'
    ) {
      if (propertyValue.includes('underline')) marks.underline = true;
      if (propertyValue.includes('line-through')) marks.strike = true;
    } else if (property === 'font-weight') {
      if (['bold', 'bolder', '700', '800', '900'].includes(propertyValue)) {
        marks.bold = true;
      }
    } else if (property === 'font-style') {
      if (propertyValue === 'italic' || propertyValue === 'oblique') {
        marks.italic = true;
      }
    }
  }

  return { style, marks };
}

export function mergeStyle(parent: Style, own: Style): Style {
  return { ...parent, ...own };
}

export function cloneStyle(style: Style): Style {
  return { ...style };
}

export function cloneMarks(marks: Marks, patch: Partial<Marks>): Marks {
  return { ...marks, ...patch };
}

export function styleKey(style: Style): string {
  return `${style.color ?? ''}|${style.background ?? ''}|${style.fontSize ?? ''}`;
}

export function marksKey(marks: Marks): string {
  return `${marks.bold ? '1' : '0'}${marks.italic ? '1' : '0'}${marks.underline ? '1' : '0'}${marks.strike ? '1' : '0'}|${marks.link ?? ''}`;
}

export function formatStyle(style: Style): string {
  const attributes: string[] = [];
  if (style.color) attributes.push(`color = ${style.color}`);
  if (style.background) attributes.push(`background = ${style.background}`);
  if (style.fontSize) attributes.push(`font = {size = ${style.fontSize}}`);
  return attributes.length > 0 ? `(${attributes.join(', ')})` : '';
}
