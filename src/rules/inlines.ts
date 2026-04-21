// @fuyeor/markdown-parser/src/rules/inlines.ts
import type { InlineRule } from '#/types';
import { InlineState } from '#/core/state';

/**
 * Support backslash at line end as <br />
 */
export const hardBreakRule: InlineRule = {
  name: 'hardbreak',
  parse(state: InlineState) {
    if (state.currentChar === '\\' && state.peek(2)[1] === '\n') {
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
  parse(state: InlineState, ctx) {
    if (state.peek(2) !== '**') return null;

    // find directly for the next **;
    // if not found, treat it as plain text.
    const endIdx = state.content.indexOf('**', state.pos + 2);
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
 * parse `inlineCode` syntax
 */
export const inlineCodeRule: InlineRule = {
  name: 'inline_code',
  parse(state: InlineState) {
    if (state.currentChar !== '`') return null;

    const endIdx = state.content.indexOf('`', state.pos + 1);
    if (endIdx === -1) return null;

    return {
      node: {
        type: 'inline_code',
        content: state.content.slice(state.pos + 1, endIdx),
      },
      consumedChars: endIdx - state.pos + 1,
    };
  },
};

/**
 * parse [Text](https://fuyeor.com) syntax
 */
export const linkRule: InlineRule = {
  name: 'link',
  parse(state: InlineState, ctx) {
    if (state.currentChar !== '[') return null;

    // find the nearest `](`
    const textEnd = state.content.indexOf('](', state.pos + 1);
    if (textEnd === -1) return null;

    // find the nearest `)`
    const urlEnd = state.content.indexOf(')', textEnd + 2);
    if (urlEnd === -1) return null;

    const innerText = state.content.slice(state.pos + 1, textEnd);
    let url = state.content.slice(textEnd + 2, urlEnd).trim();

    if (!globalThis.URL.canParse(url) && !url.startsWith('/')) {
      // try verifying as a relative or completed HTTP response
      const testUrl = url.startsWith('www.') ? `http://${url}` : url;
      if (globalThis.URL.canParse(testUrl)) url = testUrl;
      else return null;
    }

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
  parse(state: InlineState, ctx) {
    if (state.peek(2) !== '__') return null;

    const endIdx = state.content.indexOf('__', state.pos + 2);
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
  parse(state: InlineState, ctx) {
    if (state.peek(2) !== '--') return null;

    const endIdx = state.content.indexOf('--', state.pos + 2);
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
