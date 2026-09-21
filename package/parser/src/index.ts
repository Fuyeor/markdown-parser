// @ffm/parser/src/index.ts
export { MarkdownParser } from './core/parser';
export { render } from './core/render';
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
} from './rule/blocks';
export {
  hardBreakRule,
  inlineCodeRule,
  boldRule,
  linkRule,
  underlineRule,
  strikeRule,
} from './rule/inlines';
export { latexPlugin, latexInlineRule, latexBlockRule } from './plugin/latex';
export {
  twemojiPlugin,
  nativeEmojiPlugin,
  twemojiTransform,
  transformTwemojiNode,
  getTwemojiUrl,
} from './plugin/twemoji';
export { highlightPlugin, highlightTransform } from './plugin/highlight';
export {
  abcPlugin,
  abcTransform,
  mermaidPlugin,
  mermaidTransform,
  smilesBlockPlugin,
  smilesBlockTransform,
  smilesInlinePlugin,
  smilesPlugin,
  smilesInlineRule,
  SPECIAL_BLOCK_LANGUAGES,
  specialBlockPlugin,
  specialBlockTransform,
  transformSpecialBlockNode,
} from './plugin/async-blocks';
export { extensionsPlugin, extensionsTransform } from './plugin/extensions';
export { createMarkdownParser, createFuyeorMarkdownParser } from './default';

export type {
  NodeType,
  ASTNode,
  ASTTransform,
  ParserContext,
  BlockRule,
  InlineRule,
  Linkifier,
  MarkdownParserOption,
  MarkdownPlugin,
} from './type';
