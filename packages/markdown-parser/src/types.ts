// @fuyeor/markdown-parser/src/types.ts

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
  // allow plugins to attach arbitrary attributes
  [key: string]: any;
}

// inject context into rules allows them to recursively call the parser
export interface ParserContext {
  parseInline: (content: string) => ASTNode[];
  parseBlocks: (content: string) => ASTNode[];
}

// block parsing rule (such as header, code block, table)
export interface BlockRule {
  name: string;
  // Returns the generated Node and the number of rows consumed if the match is successful;
  // returns null if the match fails.
  parse: (
    state: any,
    ctx: ParserContext,
  ) => { node: ASTNode; consumedLines: number } | null;
}

// inline parsing rule (such as bold, italics, links)
export interface InlineRule {
  name: string;
  // Returns the generated Node and the number of chars consumed if the match is successful;
  // returns null if the match fails.
  parse: (
    state: any,
    ctx: ParserContext,
  ) => { node: ASTNode; consumedChars: number } | null;
}

export type MarkdownPlugin = (parser: any) => void;
