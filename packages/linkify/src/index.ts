// src/index.ts

import { CC_TLD_BITMAP } from './cc-tld-bitmap.js';

export interface LinkMatch {
  url: string;
  text: string;
  index: number;
  lastIndex: number;
}

// 候选扫描只负责找出域名形状，实际两字母 TLD 合法性由位图校验。
const LINKIFY_REGEX =
  /(https?:\/\/[^\s]+|(?<![@\w])(?:[a-zA-Z0-9\-]+\.)+(?:app|biz|com|dev|edu|gov|int|mil|net|org|pro|web|xyz|рф|xn--p1ai|[a-zA-Z]{2})(?:\/[^\s]*)?(?![\p{L}\p{N}_\-]))/giv;

const PUNYCODE_RU_TLD = 'xn--p1ai';
const PUNYCODE_RU_SUFFIX = `.${PUNYCODE_RU_TLD}`;

// Check a two-letter ASCII TLD against the generated 26×26 bitmap.
function isCcTld(text: string, start: number): boolean {
  const firstCode = text.charCodeAt(start) | 32;
  const secondCode = text.charCodeAt(start + 1) | 32;
  const bitIndex = (firstCode - 97) * 26 + secondCode - 97;

  return (CC_TLD_BITMAP[bitIndex >> 5] & (1 << (bitIndex & 31))) !== 0;
}

// Validate only fuzzy two-letter TLDs; explicit URLs and hand-written TLDs are already gated.
function isSupportedFuzzyUrl(urlStr: string): boolean {
  const hostEnd = urlStr.indexOf('/');
  const hostnameEnd = hostEnd === -1 ? urlStr.length : hostEnd;
  const tldStart = urlStr.lastIndexOf('.', hostnameEnd - 1) + 1;
  const tldLength = hostnameEnd - tldStart;

  return (
    tldLength !== 2 ||
    urlStr.startsWith('рф', tldStart) ||
    isCcTld(urlStr, tldStart)
  );
}

// Normalize the supported Russian IDN suffix while preserving the original span indexes.
function normalizeMatchText(urlStr: string): string {
  const hostEnd = urlStr.indexOf('/');
  const hostnameEnd = hostEnd === -1 ? urlStr.length : hostEnd;
  const suffixStart = hostnameEnd - PUNYCODE_RU_SUFFIX.length;

  if (suffixStart <= 0 || !urlStr.startsWith(PUNYCODE_RU_SUFFIX, suffixStart)) {
    return urlStr;
  }

  return `${urlStr.slice(0, suffixStart)}.рф${urlStr.slice(hostnameEnd)}`;
}

/**
 * 极速识别文本中的链接
 * @param text 待处理的纯文本
 * @returns 匹配的链接列表
 */
export function linkify(text: string): LinkMatch[] {
  const matches: LinkMatch[] = [];
  const punctuation = '.,:;?!';

  for (const match of text.matchAll(LINKIFY_REGEX)) {
    let urlStr = match[0];
    const matchIdx = match.index!;
    const isExplicitUrl =
      urlStr.startsWith('http://') || urlStr.startsWith('https://');

    // Skip unsupported fuzzy TLDs while keeping explicit URLs permissive.
    if (!isExplicitUrl && !isSupportedFuzzyUrl(urlStr)) continue;

    // 剔除末尾标点
    while (
      urlStr.length > 0 &&
      punctuation.includes(urlStr[urlStr.length - 1])
    ) {
      urlStr = urlStr.slice(0, -1);
    }

    // 括号平衡处理：如果末尾是 ) 且闭括号多于开括号，则剔除
    if (urlStr.endsWith(')')) {
      let openCount = 0;
      let closeCount = 0;
      for (let i = 0; i < urlStr.length; i++) {
        if (urlStr[i] === '(') openCount++;
        else if (urlStr[i] === ')') closeCount++;
      }
      if (closeCount > openCount) {
        urlStr = urlStr.slice(0, -1);
      }
    }

    const normalizedUrlStr = normalizeMatchText(urlStr);
    const fullUrl = isExplicitUrl
      ? normalizedUrlStr
      : `https://${normalizedUrlStr}`;

    matches.push({
      url: fullUrl,
      text: normalizedUrlStr,
      index: matchIdx,
      lastIndex: matchIdx + urlStr.length,
    });
  }

  return matches;
}
