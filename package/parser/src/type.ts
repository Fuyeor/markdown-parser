// @ffm/parser/src/type.ts
import type { LinkMatch } from '@ffm/linkify';
import type { MarkdownParser } from './core/parser';
import type { BlockState, InlineState } from './core/state';

export type { BlockState, InlineState } from './core/state';

// built-in type; plugins can extend the string union type
export type NodeType =
  | 'root'
  | 'paragraph'
  | 'text'
  | 'heading'
  | 'bold'
  | 'italic'
  | 'strike'
  | 'underline'
  | 'link'
  | 'image'
  | 'break'
  | 'hr'
  | 'blockquote'
  | 'code'
  | 'code_inline'
  | 'list'
  | 'list_item'
  | 'table'
  | 'table_row'
  | 'table_cell'
  | 'emoji'
  | 'math'
  | 'math_inline'
  | 'mermaid'
  | 'smiles'
  | 'smiles_inline'
  | 'abc'
  | string;

export interface ASTNode {
  type: NodeType;
  value?: string;
  content?: ASTNode[];
  level?: number;
  lang?: string;
  url?: string;
  ordered?: boolean;
  start?: number;
  header?: ASTNode[];
  name?: string;
  title?: ASTNode[];
  // image description, like <img title="..." />
  // it’s actually caption, not title
  caption?: string;
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
  // optional marker to quickly identify potential matches (e.g., '#' for headings)
  marker: string[];
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
  marker: string[];
  // Returns the generated Node and the number of chars consumed if the match is successful;
  // returns null if the match fails.
  parse: (
    state: InlineState,
    ctx: ParserContext,
  ) => { node: ASTNode; consumedChars: number } | null;
}

export type Linkifier = (text: string) => readonly LinkMatch[];

export interface MarkdownParserOption {
  maxNestingDepth?: number;
  linkifier?: Linkifier;
}

export type ASTTransform = (nodes: ASTNode[]) => ASTNode[];
export type MarkdownPlugin = (parser: MarkdownParser) => void;

// Render extension
export interface RenderContext {
  render(nodes?: ASTNode[]): string;
  escapeHtml(value: string): string;
}

export type NodeRenderer = (node: ASTNode, ctx: RenderContext) => string;

export interface RenderOption {
  nodeRenderer?: Record<string, NodeRenderer>;
}

// Async capability contract
/** Stable identifier shared between plugin declarations and async renderers. */
export type AsyncCapability = string;

export interface AsyncRenderer<Lib = unknown> {
  readonly name: AsyncCapability;
  readonly selector: string;
  readonly style?: readonly string[];
  load(): Promise<Lib>;
  render(element: HTMLElement, lib: Lib): void | Promise<void>;
}

export interface HydrateOption {
  /** Skip capabilities that the host has not declared. */
  capability?: ReadonlySet<AsyncCapability>;
  onError?: (name: AsyncCapability, error: unknown) => void;
}
