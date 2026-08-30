// @fuyeor/markdown-formatter/src/types.ts

export type Fence = {
  character: '`' | '~';
  length: number;
  language?: string;
};

export type QuoteLine = {
  content: string;
};

export type ListIndentContext = {
  levels: number[];
};

/** Configuration options for the Markdown formatter. */
export type FormatOptions = {
  /** Maximum allowable consecutive blank lines between blocks. @default 1 */
  maxConsecutiveBlankLines?: number;
};
