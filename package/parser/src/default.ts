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
  inlineCodeRule,
  linkRule,
  imageRule,
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
  const parser = new MarkdownParser(option)
    // block order: Code block -> List -> Title -> Table -> Delete line -> Quote
    .addBlockRule(ffmBlockRule)
    .addBlockRule(codeBlockRule)
    .addBlockRule(listRule)
    .addBlockRule(headingRule)
    .addBlockRule(tableRule)
    .addBlockRule(hrRule)
    .addBlockRule(blockquoteRule);

  // attach user custom block rule
  if (option.blockRule) {
    for (const rule of option.blockRule) parser.addBlockRule(rule);
  }

  parser
    // inline order: Inline code -> Links -> Bold/Underline/Strikethrough
    .addInlineRule(inlineCodeRule)
    .addInlineRule(imageRule)
    .addInlineRule(linkRule)
    .addInlineRule(boldRule)
    .addInlineRule(underlineRule)
    .addInlineRule(italicRule)
    .addInlineRule(strikeRule);

  // attach user custom inline rule
  if (option.inlineRule) {
    for (const rule of option.inlineRule) parser.addInlineRule(rule);
  }

  parser
    // plugin
    .use(highlightPlugin)
    .use(twemojiPlugin)
    .use(latexPlugin)
    .use(mermaidPlugin)
    .use(smilesPlugin)
    .use(abcPlugin);

  // attach user custom plugin
  if (option.plugin) {
    for (const plugin of option.plugin) parser.use(plugin);
  }

  // generate AST node
  return parser.build();
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
      .addInlineRule(inlineCodeRule)
      .addInlineRule(linkRule)
      .addInlineRule(boldRule)
      .addInlineRule(underlineRule)
      .addInlineRule(italicRule)
      .addInlineRule(strikeRule)

      .build()
  );
}
