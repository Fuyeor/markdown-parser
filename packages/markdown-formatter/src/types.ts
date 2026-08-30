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
