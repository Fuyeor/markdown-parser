// @ffm/editor/src/state/document.ts

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'list-item'
  | 'code-block'
  | 'quote'
  | 'divider'
  | 'table';

export type BlockAttr = {
  level?: number;
  language?: string;
  depth?: number;
  quoteDepth?: number;
  checked?: boolean;
  ordered?: boolean;
};

export type FormatType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'link'
  | 'color'
  | 'smiles';

export type Format = {
  from: number;
  to: number;
  type: FormatType;
  value?: string;
};

export type Block = {
  /** Stable identifier. Used for drag, collaboration, and incremental render. */
  id: string;
  type: BlockType;
  /** Plain text only. No syntax markers. */
  text: string;
  /** Inline formats, ranges are based on `text` character offsets. */
  formatArray: Format[];
  /** Block-level attributes, mapping to FFM FON properties. */
  attr: BlockAttr;
};

export type DocumentModel = {
  blockArray: Block[];
};
