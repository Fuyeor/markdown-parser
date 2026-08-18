// @fuyeor/markdown-parser/src/rules/inlines.ts
import type { InlineRule } from '#/types';
import { InlineState } from '#/core/state';
import { isSafeColorValue } from '#/core/color';
import { isSafeLinkUrl } from '#/core/url';

/**
 * Support backslash at line end as <br />
 */
export const hardBreakRule: InlineRule = {
  name: 'hardbreak',
  markers: ['\\', ' '],
  parse(state: InlineState) {
    if (state.currentChar === '\\' && state.content[state.pos + 1] === '\n') {
      return {
        node: { type: 'hardbreak' },
        consumedChars: 2,
      };
    }
    return null;
  },
};

/**
 * parse **bold** syntax
 */
export const boldRule: InlineRule = {
  name: 'bold',
  markers: ['*'],
  parse(state: InlineState, ctx) {
    if (!state.content.startsWith('**', state.pos)) return null;

    // find directly for the next **;
    // if not found, treat it as plain text.
    const endIdx = state.findNextToken('**', state.pos + 2);
    if (endIdx === -1) return null;

    const innerContent = state.content.slice(state.pos + 2, endIdx);
    return {
      node: {
        type: 'bold',
        // supports nested parsing
        children: ctx.parseInline(innerContent),
      },
      // +2 is because the followed `**` was consumed
      consumedChars: endIdx - state.pos + 2,
    };
  },
};

/**
 * parse *italic* or _italic_ syntax
 */
export const italicRule: InlineRule = {
  name: 'italic',
  markers: ['*'],
  parse(state: InlineState, ctx) {
    const char = state.currentChar;
    //  only triggers when it starts with * and
    // is not immediately followed by the same symbol
    // (to prevent it from overriding the bold/underline).
    if (char === '*' && state.content[state.pos + 1] !== char) {
      // find the next matching closing symbol
      const endIdx = state.findNextToken(char, state.pos + 1);

      if (endIdx === -1 || endIdx === state.pos + 1) return null;

      return {
        node: {
          type: 'italic',
          children: ctx.parseInline(state.content.slice(state.pos + 1, endIdx)),
        },
        consumedChars: endIdx - state.pos + 1,
      };
    }
    return null;
  },
};

/**
 * parse `inlineCode` syntax
 */
export const inlineCodeRule: InlineRule = {
  name: 'inline_code',
  markers: ['`'],
  parse(state: InlineState) {
    if (state.currentChar !== '`') return null;

    let markerLength = 0;
    while (state.content[state.pos + markerLength] === '`') {
      markerLength++;
    }

    const marker = '`'.repeat(markerLength);
    let currentPos = state.pos + markerLength;
    let endIdx = -1;

    while (currentPos < state.length) {
      const foundIdx = state.findNextToken(marker, currentPos);
      if (foundIdx === -1) break;

      if (state.content[foundIdx + markerLength] === '`') {
        let skipIdx = foundIdx + markerLength;
        while (state.content[skipIdx] === '`') skipIdx++;
        currentPos = skipIdx;
      } else {
        endIdx = foundIdx;
        break;
      }
    }

    if (endIdx === -1) {
      return {
        node: { type: 'text', content: marker },
        consumedChars: markerLength,
      };
    }

    let rawContent = state.content.slice(state.pos + markerLength, endIdx);

    if (
      rawContent.startsWith(' ') &&
      rawContent.endsWith(' ') &&
      rawContent.trim().length > 0
    ) {
      rawContent = rawContent.slice(1, -1);
    }

    // if it is a color, directly change it to a `color_code` node
    const isColor = isSafeColorValue(rawContent);

    return {
      node: {
        type: isColor ? 'color_code' : 'inline_code',
        content: rawContent,
      },
      consumedChars: endIdx + markerLength - state.pos,
    };
  },
};

/**
 * parse [Text](https://fuyeor.com) syntax
 */
export const linkRule: InlineRule = {
  name: 'link',
  markers: ['['],
  parse(state: InlineState, ctx) {
    if (state.currentChar !== '[') return null;

    // find the nearest `](`
    const textEnd = state.findNextToken('](', state.pos + 1);
    if (textEnd === -1) return null;

    // find the nearest `)`
    const urlEnd = state.findNextToken(')', textEnd + 2);
    if (urlEnd === -1) return null;

    const innerText = state.content.slice(state.pos + 1, textEnd);
    let url = state.content.slice(textEnd + 2, urlEnd).trim();

    // normalize www. links before applying the shared protocol policy
    const normalizedUrl = url.startsWith('www.') ? `http://${url}` : url;
    if (!isSafeLinkUrl(normalizedUrl)) return null;
    url = normalizedUrl;

    return {
      node: {
        type: 'link',
        url,
        children: ctx.parseInline(innerText),
      },
      consumedChars: urlEnd - state.pos + 1,
    };
  },
};

/**
 * parse __underline__ syntax
 */
export const underlineRule: InlineRule = {
  name: 'underline',
  markers: ['_'],
  parse(state: InlineState, ctx) {
    if (!state.content.startsWith('__', state.pos)) return null;

    const endIdx = state.findNextToken('__', state.pos + 2);
    if (endIdx === -1) return null;

    return {
      node: {
        type: 'underline',
        children: ctx.parseInline(state.content.slice(state.pos + 2, endIdx)),
      },
      consumedChars: endIdx - state.pos + 2,
    };
  },
};

/**
 * parse --strike-- syntax
 */
export const strikeRule: InlineRule = {
  name: 'strike',
  markers: ['-'],
  parse(state: InlineState, ctx) {
    if (!state.content.startsWith('--', state.pos)) return null;

    const endIdx = state.findNextToken('--', state.pos + 2);
    if (endIdx === -1) return null;

    return {
      node: {
        type: 'strike',
        children: ctx.parseInline(state.content.slice(state.pos + 2, endIdx)),
      },
      consumedChars: endIdx - state.pos + 2,
    };
  },
};
