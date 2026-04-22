// @fuyeor/markdown-parser/src/default.ts
import { MarkdownParser } from './core/parser';
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

export function createMarkdownParser() {
  return (
    new MarkdownParser()
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

export function createFuyeorMarkdownParser() {
  return (
    new MarkdownParser()
      // block order: Code block -> List -> Title -> Table -> Delete line -> Quote
      .addBlockRule(ffmBlockRule)
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
