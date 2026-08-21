// src/index.ts

export interface LinkMatch {
  url: string;
  text: string;
  index: number;
  lastIndex: number;
}

// 剔除了 md，涵盖常用 gTLD 和 ccTLD，通过前缀树压缩。
const TLD_REGEX =
  /(?:a(?:pp|[cdefgilmoqrstuwxz])|b(?:iz|[abdefghijmnorstwyz])|c(?:om|[acdfghiklmnoruvwxyz])|d(?:ev|[ejkmoz])|e(?:du|[cegrstu])|f[ijkmor]|g(?:ov|[adefghilmnpqrstuwy])|h[kmnrtu]|i(?:nfo|nt|[delmnoqrst])|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m(?:il|[aceghklmnopqrstuvwxyz])|n(?:et|[acefgilopruz])|o(?:nline|rg|m)|p[aefghklmnrstwy]|qa|r[eosuw]|s(?:tore|hop|ite|[abcdeghiklmnorstuvxyz])|t(?:ech|[cdfghjklmnortvwz])|u[agksyz]|v[aceginu]|w[fs]|xyz|y[et]|z[amw])/;

const LINKIFY_REGEX = new RegExp(
  `(https?:\\/\\/[^\\s]+|(?<![@\\w])(?:[a-zA-Z0-9\\-]+\\.)+${TLD_REGEX.source}(?:\\/[^\\s]*)?)`,
  'gv'
);

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

    // 剔除末尾标点
    while (urlStr.length > 0 && punctuation.includes(urlStr[urlStr.length - 1])) {
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

    const fullUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;

    matches.push({
      url: fullUrl,
      text: urlStr,
      index: matchIdx,
      lastIndex: matchIdx + urlStr.length,
    });
  }

  return matches;
}
