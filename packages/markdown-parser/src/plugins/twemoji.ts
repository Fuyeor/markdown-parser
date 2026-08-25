// @fuyeor/markdown-parser/src/plugins/twemoji.ts
import type { ASTNode, ASTTransform, MarkdownPlugin } from '#/types';
import { mapAstNodes } from './ast';

const r = String.raw;
const baseEmojiPattern = r`\p{Emoji}(?:\p{EMod}|[\u{E0020}-\u{E007E}]+\u{E007F}|\uFE0F?\u20E3?)`;
const emojiPattern = r`\p{RI}{2}|(?![#*\d](?!\uFE0F?\u20E3))${baseEmojiPattern}(?:\u200D${baseEmojiPattern})*`;
const emojiRegex = new RegExp(emojiPattern, 'gu');

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
  const content = node.content;
  if (typeof content !== 'string' || content.length === 0) return [node];

  emojiRegex.lastIndex = 0;
  if (!emojiRegex.test(content)) return [node];

  const nodes: ASTNode[] = [];
  let lastIndex = 0;
  emojiRegex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = emojiRegex.exec(content)) !== null) {
    const emoji = match[0];
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      nodes.push({
        type: 'text',
        content: content.slice(lastIndex, matchIndex),
      });
    }
    nodes.push({
      type: 'emoji',
      content: emoji,
      alt: emoji,
      src: getTwemojiUrl(emoji),
    });
    lastIndex = matchIndex + emoji.length;
  }

  if (lastIndex < content.length) {
    nodes.push({ type: 'text', content: content.slice(lastIndex) });
  }
  return nodes;
};

export const twemojiTransform: ASTTransform = (nodes) =>
  mapAstNodes(nodes, (node) =>
    node.type === 'text' ? transformTwemojiNode(node) : node,
  );

// Register Twemoji conversion as a post-parse AST transform.
export const twemojiPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(twemojiTransform);
};

// Keep the name used by the existing Interactify markdown-it integration.
export const nativeEmojiPlugin = twemojiPlugin;
