// @ffm/converter/src/type.ts
export type TextNode = {
  data: string;
};

export type ElementNode = {
  name: string;
  attribs: Record<string, string>;
  children: ChildNode[];
};

export type ChildNode = ElementNode | TextNode | { [key: string]: unknown };

export type Style = {
  color?: string | null;
  background?: string | null;
  fontSize?: string;
};

export type Mark = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  link?: string;
};

export type InlinePiece = {
  content: string;
  style: Style;
  mark: Mark;
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

export type ColorResolver = {
  parseColor: (value: string) => string | null;
  isTransparentColor: (value: string) => boolean;
};
