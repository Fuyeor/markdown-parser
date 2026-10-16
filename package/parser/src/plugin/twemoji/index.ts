// @ffm/parser/src/plugin/twemoji/index.ts
import { mapAstNode } from '#/plugin/ast';
import type { ASTNode, ASTTransform, MarkdownPlugin } from '#/type';

/*
 * 匹配所有 Emoji，包括组合 Emoji、旗帜、修饰符、变体、标签、ZWJ 等，来自于：
 * https://github.com/slevithan/emoji-regex-xs/blob/main/regex.mjs
 * 以前的 emoji-regex 库方案：
 * https://github.com/Fuyeor/monorepo/commit/1e7c3bdc180613214c9555f57e1d48a3edf7ae03
 */
const r = String.raw;
// 基础 Emoji 匹配（含各种修饰符）
const base = r`\p{Emoji}(?:\p{EMod}|[\u{E0020}-\u{E007E}]+\u{E007F}|\uFE0F?\u20E3?)`;
// 完整递归匹配（含旗帜和组合 Emoji）
const regexPattern = r`\p{RI}{2}|(?![#*\d](?!\uFE0F?\u20E3))${base}(?:\u200D${base})*`;
// 构建正则对象
const emojiRegex = new RegExp(regexPattern, 'gu');

// Emoji 起始字符预检：覆盖 \p{Emoji} 全部非 ASCII 起始块，以及
// ZWJ / VS16 / keycap 组合符。语义与 emojiRegex 完全对齐，只做"有无候选"判定。
// 纯 ASCII 与 CJK 混排正文通常一击即不命中，直接跳过昂贵的 \p{Emoji} 扫描。
const isEmojiLike =
  /[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2194-\u21AA\u231A-\u23FA\u24C2\u25AA-\u27BF\u2934\u2935\u2B05-\u2B55\u3030\u303D\u3297\u3299\uD83C-\uD83E\uFE0F\u200D\u20E3]/;

// Convert a raw Emoji sequence to the Twemoji CDN codepoint path.
export const getTwemojiUrl = (emoji: string): string => {
  const codepoints = Array.from(emoji)
    .map((character) => character.codePointAt(0)!.toString(16))
    .filter((codepoint) => codepoint !== 'fe0f')
    .join('-');
  return `https://deliver.fuyeor.net/@libs/twemoji-new/svg/${codepoints}.svg`;
};

// Split text nodes into plain text and emoji image nodes without touching code.
export const transformTwemojiNode = (node: ASTNode): ASTNode[] => {
  const content = node.value;
  if (typeof content !== 'string' || content.length === 0) return [node];

  // 快速预检：无 emoji 候选字符则直接跳过 \p{Emoji} 扫描
  if (!isEmojiLike.test(content)) return [node];

  emojiRegex.lastIndex = 0;
  if (!emojiRegex.test(content)) return [node];

  const nodeArray: ASTNode[] = [];
  let lastIndex = 0;
  emojiRegex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = emojiRegex.exec(content)) !== null) {
    const emoji = match[0];
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      nodeArray.push({
        type: 'text',
        value: content.slice(lastIndex, matchIndex),
      });
    }
    nodeArray.push({
      type: 'emoji',
      value: emoji,
      alt: emoji,
      src: getTwemojiUrl(emoji),
    });
    lastIndex = matchIndex + emoji.length;
  }

  if (lastIndex < content.length) {
    nodeArray.push({ type: 'text', value: content.slice(lastIndex) });
  }
  return nodeArray;
};

export const twemojiTransform: ASTTransform = (nodeArray) =>
  mapAstNode(nodeArray, (node) =>
    node.type === 'text' ? transformTwemojiNode(node) : node,
  );

// Register Twemoji conversion as a post-parse AST transform.
export const twemojiPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(twemojiTransform);
};
