// @fuyeor/markdown-parser/src/rules/ffm.ts
import { BlockState } from '#/core/state';
import { extractFencedBlock } from './blocks';
import type { BlockRule, ASTNode } from '#/types';

const FFM_KEYWORDS = new Set(['quote', 'slide', 'chain', 'accordion']);

// matches two horizontal newline characters before and after the match
// allows spaces in between, e.g., \n\n --- \n\n
const SLIDE_SEPARATOR_REGEX = /\n\n\s*---\s*\n\n/g;

// ffm block title
const TITLE_REGEX = /^\s*\*\*(?:\[([ xX])\]\s*)?(.+?)\*\*\s*$/;

/**
 * intercept special fuyeor flavored markdown blocks (accordion, slide, chain, quote)
 */
export const ffmBlockRule: BlockRule = {
  name: 'ffm_blocks',
  // same as code block to leverage fenced block parsing
  markers: ['`', '~'],
  parse(state: BlockState, ctx) {
    const block = extractFencedBlock(state);
    if (!block) return null;

    const type = block.lang.split(/\s+/)[0];

    // skip if it's not a specific keyword, leave it to codeBlockRule.
    if (!FFM_KEYWORDS.has(type)) return null;

    const { content: rawContent, consumedLines } = block;

    // ffm quote: recursively render the internal Markdown
    if (type === 'quote') {
      return {
        node: { type: 'blockquote', children: ctx.parseBlocks(rawContent) },
        consumedLines,
      };
    }

    // ffm slide
    if (type === 'slide') {
      const slideContents = rawContent
        .split(SLIDE_SEPARATOR_REGEX)
        .filter((s) => s.trim().length > 0);

      const slides = slideContents.map((s) => ({
        type: 'slide_item',
        children: ctx.parseBlocks(s.trim()),
      }));

      return { node: { type: 'slide', children: slides }, consumedLines };
    }

    // ffm chain and accordion
    if (type === 'accordion' || type === 'chain') {
      const items: ASTNode[] = [];
      let currentItem: any = null;
      let currentLines: string[] = [];
      // collect the text before the first title
      let preambleLines: string[] = [];

      // generate a unique name for mutually exclusive folding
      const accordionName =
        type === 'accordion'
          ? `acc-${Math.random().toString(36).slice(2, 8)}`
          : undefined;

      rawContent.split('\n').forEach((l) => {
        const titleMatch = l.match(TITLE_REGEX);
        if (titleMatch) {
          // archive the previous item, or archive free content
          if (!currentItem) {
            if (
              currentLines.length > 0 &&
              currentLines.join('').trim() !== ''
            ) {
              // the text preceding the title is free content
              preambleLines = currentLines;
            }
          } else {
            currentItem.children = ctx.parseBlocks(
              currentLines.join('\n').trim(),
            );
          }

          const checkboxMark = titleMatch[1];
          currentItem = {
            type: type === 'accordion' ? 'accordion_item' : 'chain_item',
            name: accordionName,
            title: ctx.parseInline(titleMatch[2]),
            children: [],
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
      });

      // archive the last item or go back
      if (currentItem) {
        currentItem.children = ctx.parseBlocks(currentLines.join('\n').trim());
      } else {
        // if no valid title is found from beginning to end
        // revert to displaying regular content
        if (currentLines.length > 0 && currentLines.join('').trim() !== '') {
          preambleLines = currentLines;
        }
      }

      const children: ASTNode[] = [];
      if (preambleLines.length > 0) {
        children.push(...ctx.parseBlocks(preambleLines.join('\n').trim()));
      }
      children.push(...items);

      return { node: { type, name: accordionName, children }, consumedLines };
    }

    // fallback
    return {
      node: { type: 'code_block', lang: type, content: rawContent },
      consumedLines,
    };
  },
};
