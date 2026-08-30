// @fuyeor/html2ffm/src/style.ts
import { isTransparentColor, parseColor } from './color';
import { CSS_LENGTH_PATTERN } from './constants';
import type { Marks, Style } from './types';

export function parseFontSize(value: string): string | null {
  const normalized = value.trim().replace(/\s*!important\s*$/iu, '');
  return CSS_LENGTH_PATTERN.test(normalized) ? normalized : null;
}

// Parse supported inline declarations while preserving CSS last-valid semantics.
export function parseInlineStyle(value: string | undefined): Style {
  if (!value) return {};
  const style: Style = {};
  for (const declaration of value.split(';')) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;
    const property = declaration.slice(0, colonIndex).trim().toLowerCase();
    const propertyValue = declaration
      .slice(colonIndex + 1)
      .trim()
      .replace(/\s*!important\s*$/iu, '');
    if (property === 'color') {
      const color = parseColor(propertyValue);
      if (color !== null) style.color = color;
      else if (isTransparentColor(propertyValue)) style.color = null;
    } else if (property === 'font-size') {
      const fontSize = parseFontSize(propertyValue);
      if (fontSize !== null) style.fontSize = fontSize;
    }
  }
  return style;
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
  return `${style.color ?? ''}|${style.fontSize ?? ''}`;
}

export function marksKey(marks: Marks): string {
  return `${marks.bold ? '1' : '0'}${marks.italic ? '1' : '0'}${marks.underline ? '1' : '0'}${marks.strike ? '1' : '0'}|${marks.link ?? ''}`;
}

export function formatStyle(style: Style): string {
  const attributes: string[] = [];
  if (style.color) attributes.push(`color = ${style.color}`);
  if (style.fontSize) attributes.push(`font = {size = ${style.fontSize}}`);
  return attributes.length > 0 ? `(${attributes.join(', ')})` : '';
}
