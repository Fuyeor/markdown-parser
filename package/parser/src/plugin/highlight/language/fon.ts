// @ffm/parser/src/plugin/highlight/language/fon.ts
import type { Language } from '#/plugin/highlight/type';

/**
 * Highlight.js grammar definition for Fer Object Notation (FON).
 */
export default function fon(hljs: any): Language {
  return {
    name: 'FON',
    keywords: {
      literal: 'true false',
    },
    contains: [
      // 注释支持 (//, /* */, ///)
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      // 反引号字符串 (`string`)
      {
        className: 'string',
        begin: /`/,
        end: /`/,
        contains: [hljs.BACKSLASH_ESCAPE],
      },
      // 数字
      {
        className: 'number',
        begin: /\b[0-9]+\b/,
      },
      // 键与属性声明 (key = 或 key:)
      {
        className: 'attr',
        begin: /\b[a-z0-9\-]+\s*(?=\=|:)/,
      },
      // 标点分割与界定符
      {
        className: 'punctuation',
        begin: /[{}()\[\],]/,
      },
      // 赋值与冒号算子
      {
        className: 'operator',
        begin: /(=|:)/,
      },
    ],
  };
}
