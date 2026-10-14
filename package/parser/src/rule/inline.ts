// @ffm/parser/src/rule/inline.ts
import { InlineState } from '#/core/state';
import { isSafeColorValue } from '#/core/color';
import { isSafeLinkUrl } from '#/core/url';
import type { ASTNode, InlineRule } from '#/type';

/**
 * parse **bold** syntax
 */
export const boldRule: InlineRule = {
  name: 'bold',
  marker: ['*'],
  parse(state: InlineState, ctx) {
    if (!state.content.startsWith('**', state.pos)) return null;

    const innerStart = state.pos + 2;
    // 起始为 *** 时，内部以 * 开头（斜体标记）
    const nested = state.content[innerStart] === '*';

    let endIdx = state.findNextToken('**', innerStart);
    if (endIdx === -1) return null;

    // 结束也是 *** 时，跳过结束序列的首个 *，让内层 * 闭合斜体
    if (nested && state.content[endIdx + 2] === '*') endIdx += 1;

    return {
      node: {
        type: 'bold',
        content: ctx.parseInline(state.content.slice(innerStart, endIdx)),
      },
      // +2 is because the followed `**` was consumed
      consumedChars: endIdx - state.pos + 2,
    };
  },
};

/**
 * parse *italic* syntax
 */
export const italicRule: InlineRule = {
  name: 'italic',
  marker: ['*'],
  parse(state: InlineState, ctx) {
    // 下一个字符也是 * 时让位给 boldRule
    if (state.content[state.pos + 1] === '*') return null;

    const endIdx = state.findNextToken('*', state.pos + 1);
    if (endIdx === -1) return null;

    return {
      node: {
        type: 'italic',
        content: ctx.parseInline(state.content.slice(state.pos + 1, endIdx)),
      },
      consumedChars: endIdx - state.pos + 1,
    };
  },
};

/**
 * parse `inlineCode` syntax
 */
export const inlineCodeRule: InlineRule = {
  name: 'code_inline',
  marker: ['`'],
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
        node: { type: 'text', value: marker },
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

    // if it is a color, directly change it to a `code_color` node
    const isColor = isSafeColorValue(rawContent);

    return {
      node: {
        type: isColor ? 'code_color' : 'code_inline',
        value: rawContent,
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
  marker: ['['],
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
        content: ctx.parseInline(innerText),
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
  marker: ['_'],
  parse(state: InlineState, ctx) {
    if (!state.content.startsWith('__', state.pos)) return null;

    const endIdx = state.findNextToken('__', state.pos + 2);
    if (endIdx === -1) return null;

    return {
      node: {
        type: 'underline',
        content: ctx.parseInline(state.content.slice(state.pos + 2, endIdx)),
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
  marker: ['-'],
  parse(state: InlineState, ctx) {
    if (!state.content.startsWith('--', state.pos)) return null;

    const endIdx = state.findNextToken('--', state.pos + 2);
    if (endIdx === -1) return null;

    return {
      node: {
        type: 'strike',
        content: ctx.parseInline(state.content.slice(state.pos + 2, endIdx)),
      },
      consumedChars: endIdx - state.pos + 2,
    };
  },
};

/**
 * parse ![alt](url "caption") syntax; opt-in via addInlineRule
 */
export const imageRule: InlineRule = {
  name: 'image',
  marker: ['!'],
  parse(state: InlineState) {
    if (state.currentChar !== '!') return null;
    if (state.content[state.pos + 1] !== '[') return null;

    const altEnd = state.findNextToken('](', state.pos + 2);
    if (altEnd === -1) return null;

    const urlEnd = state.findNextToken(')', altEnd + 2);
    if (urlEnd === -1) return null;

    const alt = state.content.slice(state.pos + 2, altEnd).trim();
    const raw = state.content.slice(altEnd + 2, urlEnd).trim();

    // 拆出可选的 caption 部分不含空白，title 由成对引号包裹
    const match = raw.match(/^(\S+)(?:\s+(?:"([^"]*)"|'([^']*)'))?$/);
    if (!match) return null;

    const rawUrl = match[1];
    const normalizedUrl = rawUrl.startsWith('www.')
      ? `http://${rawUrl}`
      : rawUrl;
    if (!isSafeLinkUrl(normalizedUrl)) return null;

    const node: ASTNode = { type: 'image', url: normalizedUrl, alt };
    const caption = match[2] ?? match[3];
    if (caption !== undefined) node.caption = caption;

    return {
      node,
      consumedChars: urlEnd - state.pos + 1,
    };
  },
};
