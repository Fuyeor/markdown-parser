// @ffm/linkify/src/index.ts
import { ccBitmap, linkRegex } from './constant';

export interface LinkMatch {
  url: string;
  text: string;
  index: number;
  lastIndex: number;
}

const punctuation = '.,:;?!';

// Check a two-letter ASCII TLD against the generated 26×26 bitmap.
function isCcTld(text: string, start: number): boolean {
  // 正则已经确保了字符在 a-zA-Z 范围内
  const bitIndex =
    ((text.charCodeAt(start) | 32) - 97) * 26 +
    ((text.charCodeAt(start + 1) | 32) - 97);

  return (ccBitmap[bitIndex >> 5] & (1 << (bitIndex & 31))) !== 0;
}

// Validate only fuzzy two-letter TLDs; gTLD is already verified by regex.
function isSupportedFuzzyUrl(urlStr: string): boolean {
  const hostEnd = urlStr.indexOf('/');
  const hostnameEnd = hostEnd === -1 ? urlStr.length : hostEnd;
  const tldStart = urlStr.lastIndexOf('.', hostnameEnd - 1) + 1;
  const tldLength = hostnameEnd - tldStart;

  return tldLength !== 2 || isCcTld(urlStr, tldStart);
}

// 统计未配对的多余右括号
function countExcessCloseParen(text: string, end: number): number {
  let open = 0;
  let close = 0;
  for (let i = 0; i < end; i++) {
    const code = text.charCodeAt(i);
    // '('
    if (code === 40) open++;
    // ')'
    else if (code === 41) close++;
  }
  return close > open ? close - open : 0;
}

/**
 * 极速识别文本中的链接
 * @param text 待处理的纯文本
 * @returns 匹配的链接列表
 */
export function linkify(text: string): LinkMatch[] {
  const matches: LinkMatch[] = [];

  linkRegex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    let urlStr = match[0];
    const matchIdx = match.index;
    const isExplicitUrl =
      urlStr.startsWith('http://') || urlStr.startsWith('https://');

    let end = urlStr.length;

    // 只有当末尾确实含有右括号时，才单趟扫描括号平衡度
    let excessParen =
      urlStr[end - 1] === ')' ? countExcessCloseParen(urlStr, end) : 0;

    // 快慢路徑分離：
    while (end > 0) {
      const lastChar = urlStr[end - 1];

      // 常見標點快篩
      if (punctuation.includes(lastChar)) {
        end--;
        continue;
      }

      // 只有末尾真的是 ) 時，才按需計算失衡右括號
      if (lastChar === ')' && excessParen > 0) {
        excessParen--;
        end--;
        continue;
      }

      break;
    }

    // 只有发生裁剪时才分配新字符串
    if (end < urlStr.length) {
      urlStr = urlStr.slice(0, end);
    }

    // 修剪完成后再校验域名
    if (!isExplicitUrl && !isSupportedFuzzyUrl(urlStr)) continue;

    const fullUrl = isExplicitUrl ? urlStr : `https://${urlStr}`;

    matches.push({
      url: fullUrl,
      text: urlStr,
      index: matchIdx,
      lastIndex: matchIdx + urlStr.length,
    });
  }

  return matches;
}
