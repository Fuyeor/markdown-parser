// @ffm/parser/src/default.ts
import { MarkdownParser } from './core/parser';
import {
  headingRule,
  tableRule,
  codeBlockRule,
  listRule,
  hrRule,
  blockquoteRule,
} from './rule/block';
import {
  hardBreakRule,
  inlineCodeRule,
  linkRule,
  boldRule,
  underlineRule,
  italicRule,
  strikeRule,
} from './rule/inline';
import { ffmBlockRule } from './rule/ffm';
import type { MarkdownParserOption } from './type';

import { twemojiPlugin } from './plugin/twemoji';
import { highlightPlugin } from './plugin/highlight';
import { latexPlugin } from './plugin/latex';
import { mermaidPlugin } from './plugin/mermaid';
import { smilesPlugin } from './plugin/smiles';
import { abcPlugin } from './plugin/abc';

export function createMarkdownParser(option: MarkdownParserOption = {}) {
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
      // inline order: Inline code -> Links -> Bold/Underline/Strikethrough
      .addInlineRule(hardBreakRule)
      .addInlineRule(inlineCodeRule)
      .addInlineRule(linkRule)
      .addInlineRule(boldRule)
      .addInlineRule(underlineRule)
      .addInlineRule(italicRule)
      .addInlineRule(strikeRule)
      // plugin
      .use(twemojiPlugin)
      .use(latexPlugin)
      .use(mermaidPlugin)
      .use(smilesPlugin)
      .use(abcPlugin)
      // NOTE: Must be last. It capitalizes lang
      // breaking plugins that match lowercase names
      .use(highlightPlugin)
      // generate AST node
      .build()
  );
}

export function createCommonParser(option: MarkdownParserOption = {}) {
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
