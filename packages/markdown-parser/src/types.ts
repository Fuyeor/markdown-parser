// @fuyeor/markdown-parser/src/types.ts

import type { LinkMatch } from '@fuyeor/linkify';
import type { MarkdownParser } from './core/parser';
import type { BlockState, InlineState } from './core/state';

// built-in type; plugins can extend the string union type
export type NodeType =
  | 'root'
  | 'paragraph'
  | 'text'
  | 'heading'
  | 'code_block'
  | 'blockquote'
  | 'list'
  | 'list_item'
  | 'table'
  | 'table_row'
  | 'table_cell'
  | 'math_inline'
  | 'math_block'
  | 'bold'
  | 'italic'
  | 'link'
  | 'hardbreak'
  | 'hr'
  | string;

export interface ASTNode {
  type: NodeType;
  content?: string;
  children?: ASTNode[];
  level?: number;
  lang?: string;
  url?: string;
  ordered?: boolean;
  start?: number;
  headers?: ASTNode[];
  name?: string;
  title?: ASTNode[];
  isCompleted?: boolean;
  hasCheckbox?: boolean;
  // allow plugins to attach arbitrary attributes
  [key: string]: unknown;
}

// inject context into rules allows them to recursively call the parser
export interface ParserContext {
  parseInline: (content: string) => ASTNode[];
  parseBlocks: (content: string) => ASTNode[];
  createId: (prefix: string) => string;
}

// block parsing rule (such as header, code block, table)
export interface BlockRule {
  name: string;
  // optional markers to quickly identify potential matches (e.g., '#' for headings)
  markers: string[];
  // Returns the generated Node and the number of rows consumed if the match is successful;
  // returns null if the match fails.
  parse: (
    state: BlockState,
    ctx: ParserContext,
  ) => { node: ASTNode; consumedLines: number } | null;
}

// inline parsing rule (such as bold, italics, links)
export interface InlineRule {
  name: string;
  markers: string[];
  // Returns the generated Node and the number of chars consumed if the match is successful;
  // returns null if the match fails.
  parse: (
    state: InlineState,
    ctx: ParserContext,
  ) => { node: ASTNode; consumedChars: number } | null;
}

export type Linkifier = (text: string) => readonly LinkMatch[];

export interface MarkdownParserOptions {
  maxNestingDepth?: number;
  linkifier?: Linkifier;
}

export type MarkdownPlugin = (parser: MarkdownParser) => void;
