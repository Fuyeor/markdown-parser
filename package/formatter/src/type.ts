// @ffm/formatter/src/type.ts

export type Fence = {
  character: '`' | '~';
  length: number;
  language?: string;
};

export type QuoteLine = {
  content: string;
};

/** Internal parser state tracking the stack of list indentation depths. */
export type ListIndentContext = {
  levels: number[];
};

export type AutoCaseHeadingOption = 'sentence' | 'title' | 'capitalize';

export type AutoCaseOption = {
  sentence?: 'capitalize';
  heading?: AutoCaseHeadingOption;
  glossary?: Record<string, string>;
};

export type ContinuousScriptOption = {
  autoSpacing?: boolean;
  autoUpperWord?: boolean;
  fullwidthPunctuation?: boolean;
};

export type TextTransformer = (text: string) => string;

/** Complete configuration options for deterministic Markdown and FFM formatting. */
export type FormatOption = {
  autoCase?: AutoCaseOption;
  continuousScript?: ContinuousScriptOption;
  transformer?: TextTransformer;
  maxBlankLine?: number;
};
