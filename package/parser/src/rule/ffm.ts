// @ffm/parser/src/rule/ffm.ts
import { BlockState } from '#/core/state';
import { extractFencedBlock } from './block';
import type { BlockRule, ASTNode } from '#/type';

const ffmKeyword = new Set(['quote', 'slide', 'chain', 'accordion']);

// matches two horizontal newline characters before and after the match
// allows spaces in between, e.g., \n\n --- \n\n
const slideSeparatorRegex = /\n\n\s*---\s*\n\n/g;

// ffm block title
const nodeTitleRegex = /^\s*\*\*(?:\[([ xX])\]\s*)?(.+?)\*\*\s*$/;

/**
 * intercept special fuyeor flavored markdown blocks (accordion, slide, chain, quote)
 */
export const ffmBlockRule: BlockRule = {
  name: 'ffm_blocks',
  // same as code block to leverage fenced block parsing
  marker: ['`', '~'],
  parse(state: BlockState, ctx) {
    const block = extractFencedBlock(state);
    if (!block) return null;

    const type = block.lang.split(/\s+/)[0];

    // skip if it's not a specific keyword, leave it to codeBlockRule.
    if (!ffmKeyword.has(type)) return null;

    const { content: rawContent, consumedLines } = block;

    // ffm quote: recursively render the internal Markdown
    if (type === 'quote') {
      return {
        node: { type: 'blockquote', content: ctx.parseBlocks(rawContent) },
        consumedLines,
      };
    }

    // ffm slide
    if (type === 'slide') {
      const slideContents = rawContent
        .split(slideSeparatorRegex)
        .filter((s) => s.trim().length > 0);

      const slides = slideContents.map((s) => ({
        type: 'slide_item',
        content: ctx.parseBlocks(s.trim()),
      }));

      return { node: { type: 'slide', content: slides }, consumedLines };
    }

    // ffm chain and accordion
    if (type === 'accordion' || type === 'chain') {
      const items: ASTNode[] = [];
      let currentItem: ASTNode | null = null;
      let currentLines: string[] = [];
      // collect the text before the first title
      let preambleLines: string[] = [];

      // generate a unique name for mutually exclusive folding
      const accordionName =
        type === 'accordion' ? ctx.createId('acc') : undefined;

      for (const l of rawContent.split('\n')) {
        const titleMatch = l.match(nodeTitleRegex);
        if (titleMatch) {
          // archive the previous item, or archive free content
          const previousItem = currentItem;
          if (!previousItem) {
            if (
              currentLines.length > 0 &&
              currentLines.join('').trim() !== ''
            ) {
              // the text preceding the title is free content
              preambleLines = currentLines;
            }
          } else {
            previousItem.content = ctx.parseBlocks(
              currentLines.join('\n').trim(),
            );
          }

          const checkboxMark = titleMatch[1];
          currentItem = {
            type: type === 'accordion' ? 'accordion_item' : 'chain_item',
            name: accordionName,
            title: ctx.parseInline(titleMatch[2]),
            content: [],
            ...(type === 'chain'
              ? {
                  isCompleted: checkboxMark
                    ? checkboxMark.toLowerCase() === 'x'
                    : false,
                  hasCheckbox: !!checkboxMark,
                }
              : {}),
          };
          items.push(currentItem);
          currentLines = [];
        } else {
          currentLines.push(l);
        }
      }

      // archive the last item or go back
      const lastItem = currentItem;
      if (lastItem) {
        lastItem.content = ctx.parseBlocks(currentLines.join('\n').trim());
      } else {
        // if no valid title is found from beginning to end
        // revert to displaying regular content
        if (currentLines.length > 0 && currentLines.join('').trim() !== '') {
          preambleLines = currentLines;
        }
      }

      const content: ASTNode[] = [];
      if (preambleLines.length > 0) {
        content.push(...ctx.parseBlocks(preambleLines.join('\n').trim()));
      }
      content.push(...items);

      return { node: { type, name: accordionName, content }, consumedLines };
    }

    // fallback
    return {
      node: { type: 'code_block', lang: type, value: rawContent },
      consumedLines,
    };
  },
};
