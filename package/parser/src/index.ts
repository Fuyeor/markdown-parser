// @ffm/parser/src/index.ts
export { MarkdownParser } from './core/parser';
export { render, escapeHtml } from './core/render';
export { toPlainText } from './core/plain-text';
export { isSafeColorValue } from './core/color';
export { isSafeLinkUrl } from './core/url';
export {
  headingRule,
  tableRule,
  codeBlockRule,
  listRule,
  hrRule,
  blockquoteRule,
} from './rule/block';
export {
  hardBreakRule,
  inlineCodeRule,
  boldRule,
  linkRule,
  underlineRule,
  strikeRule,
} from './rule/inline';
export { createMarkdownParser, createCommonParser } from './default';

export type {
  NodeType,
  ASTNode,
  ASTTransform,
  ParserContext,
  BlockRule,
  InlineRule,
  Linkifier,
  MarkdownParserOption,
  NodeRenderer,
  RenderContext,
  RenderOption,
  MarkdownPlugin,
  AsyncCapability,
  AsyncRenderer,
  HydrateOption,
} from './type';
