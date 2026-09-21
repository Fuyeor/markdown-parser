// @fuyeor/markdown-parser/src/default.ts
import { MarkdownParser } from './core/parser';
import type { MarkdownParserOptions } from './types';
import {
  headingRule,
  tableRule,
  codeBlockRule,
  listRule,
  hrRule,
  blockquoteRule,
} from './rules/blocks';
import {
  hardBreakRule,
  inlineCodeRule,
  linkRule,
  boldRule,
  underlineRule,
  italicRule,
  strikeRule,
} from './rules/inlines';
import { ffmBlockRule } from './rules/ffm';
import { latexPlugin } from './plugins/latex';
import { extensionsPlugin } from './plugins/extensions';

export function createMarkdownParser(options: MarkdownParserOptions = {}) {
  return (
    new MarkdownParser(options)
      // block order: Code block -> List -> Title -> Table -> Delete line -> Quote
      .addBlockRule(codeBlockRule)
      .addBlockRule(listRule)
      .addBlockRule(headingRule)
      .addBlockRule(tableRule)
      .addBlockRule(hrRule)
      .addBlockRule(blockquoteRule)

      // inline order: Inline code -> Links -> Bold/Underline/Strikethrough
      .addInlineRule(hardBreakRule)
      .addInlineRule(inlineCodeRule)
      .addInlineRule(linkRule)
      .addInlineRule(boldRule)
      .addInlineRule(underlineRule)
      .addInlineRule(italicRule)
      .addInlineRule(strikeRule)

      .build()
  );
}

export function createFuyeorMarkdownParser(
  options: MarkdownParserOptions = {},
) {
  return (
    new MarkdownParser(options)
      // block order: Code block -> List -> Title -> Table -> Delete line -> Quote
      .addBlockRule(ffmBlockRule)
      .addBlockRule(codeBlockRule)
      .addBlockRule(listRule)
      .addBlockRule(headingRule)
      .addBlockRule(tableRule)
      .addBlockRule(hrRule)
      .addBlockRule(blockquoteRule)
      .use(latexPlugin)
      .use(extensionsPlugin)

      // inline order: Inline code -> Links -> Bold/Underline/Strikethrough
      .addInlineRule(hardBreakRule)
      .addInlineRule(inlineCodeRule)
      .addInlineRule(linkRule)
      .addInlineRule(boldRule)
      .addInlineRule(underlineRule)
      .addInlineRule(italicRule)
      .addInlineRule(strikeRule)

      .build()
  );
}
