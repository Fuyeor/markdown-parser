// @fuyeor/markdown-parser/src/rules/twemoji.ts
import type { InlineRule, MarkdownPlugin } from '#/types';

const TWEMOJI_CDN = 'https://deliver.fuyeor.net/@libs/twemoji-new/svg/';
const r = String.raw;

// Match base emoji, flags, keycaps, tag sequences, variation selectors, and ZWJ sequences.
const baseEmoji = r`\p{Emoji}(?:\p{EMod}|[\u{E0020}-\u{E007E}]+\u{E007F}|\uFE0F?\u20E3?)`;
const emojiRegex = new RegExp(
  r`\p{RI}{2}|(?![#*\d](?!\uFE0F?\u20E3))${baseEmoji}(?:\u200D${baseEmoji})*`,
  'gu',
);
const emojiStartRegex = /^\p{Emoji}$/u;
const keycapStartRegex = /^(?:[#*\d]\uFE0F?\u20E3)/u;

function getTwemojiUrl(emoji: string): string {
  return `${TWEMOJI_CDN}${Array.from(emoji)
    .map((character) => character.codePointAt(0)!.toString(16))
    .filter((codePoint) => codePoint !== 'fe0f')
    .join('-')}.svg`;
}

function isEmojiCandidate(content: string, position: number): boolean {
  const codePoint = content.codePointAt(position);
  if (codePoint === undefined) return false;

  const character = String.fromCodePoint(codePoint);
  if (!emojiStartRegex.test(character)) return false;

  return codePoint > 0x7f || keycapStartRegex.test(content.slice(position));
}

// Match one emoji at the current parser position without scanning ordinary text repeatedly.
export const twemojiRule: InlineRule = {
  name: 'twemoji',
  markers: [],
  fallback: true,
  parse(state) {
    if (!isEmojiCandidate(state.content, state.pos)) return null;

    emojiRegex.lastIndex = state.pos;
    const match = emojiRegex.exec(state.content);
    if (!match || match.index !== state.pos) return null;

    const emoji = match[0];
    return {
      node: {
        type: 'twemoji',
        emoji,
        url: getTwemojiUrl(emoji),
      },
      consumedChars: emoji.length,
    };
  },
};

// Register Twemoji as an opt-in FFM inline extension.
export const twemojiPlugin: MarkdownPlugin = (parser) => {
  parser.addInlineRule(twemojiRule);
};
