// @fuyeor/html2ffm/src/types.ts
import type { parseDocument } from 'htmlparser2';

export type ParsedDocument = ReturnType<typeof parseDocument>;
export type ChildNode = ParsedDocument['children'][number];

export type ElementNode = ChildNode & {
  name: string;
  attribs: Record<string, string>;
  children: ChildNode[];
};

export type TextNode = ChildNode & {
  data: string;
};

export type Style = {
  color?: string | null;
  fontSize?: string;
};

export type Marks = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  link?: string;
};

export type InlinePiece = {
  content: string;
  style: Style;
  marks: Marks;
};

export type Rgba = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

export type TableRow = {
  cells: ElementNode[];
  isHeader: boolean;
};
