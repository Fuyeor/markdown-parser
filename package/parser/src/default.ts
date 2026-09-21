// @ffm/parser/src/default.ts
import { MarkdownParser } from './core/parser';
import type { MarkdownParserOption } from './type';
import {
  headingRule,
  tableRule,
  codeBlockRule,
  listRule,
  hrRule,
  blockquoteRule,
} from './rule/blocks';
import {
  hardBreakRule,
  inlineCodeRule,
  linkRule,
  boldRule,
  underlineRule,
  italicRule,
  strikeRule,
} from './rule/inlines';
import { ffmBlockRule } from './rule/ffm';
import { latexPlugin } from './plugin/latex';
import { extensionsPlugin } from './plugin/extensions';

export function createMarkdownParser(option: MarkdownParserOption = {}) {
  return (
    new MarkdownParser(option)
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

export function createFuyeorMarkdownParser(option: MarkdownParserOption = {}) {
  return (
    new MarkdownParser(option)
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
