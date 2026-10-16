// @ffm/parser/src/plugin/highlight/language/ffm.ts
import type { Language } from '#/plugin/highlight/type';

/**
 * Highlight.js grammar definition for Fuyeor Flavored Markdown (FFM).
 */
export default function ffm(): Language {
  return {
    name: 'FFM',
    aliases: ['ffm', 'markdown', 'md'],
    contains: [
      // 仅支持 ATX 风格标题 (# ## ###)
      {
        className: 'section',
        begin: /^#{1,6}\s+.*$/,
      },
      // FFM 特殊块语法：slide, chain, accordion, quote 等
      {
        className: 'meta',
        begin: /^(`{3,4})(slide|chain|accordion|quote|mermaid|smiles|abc)\b/,
        end: '\\1',
      },
      // 通用栅栏代码块 (```)
      // 用字符串 '\\1' 匹配组 1 (N 个反引号)
      {
        className: 'code',
        begin: /^(`{3,})/,
        end: '\\1',
      },
      // 行内代码 (`code`)
      {
        className: 'code',
        begin: /`/,
        end: /`/,
      },
      // 删除线 (--strikethrough--)
      {
        className: 'deletion',
        begin: /--/,
        end: /--/,
      },
      // 下划线 (__underline__)
      {
        className: 'underline',
        begin: /__/,
        end: /__/,
      },
      // 加粗 (**bold**)
      {
        className: 'strong',
        begin: /\*\*/,
        end: /\*\*/,
      },
      // 斜体 (*italic*)
      {
        className: 'emphasis',
        begin: /\*/,
        end: /\*/,
      },
      // 引用行 (>)
      {
        className: 'quote',
        begin: /^\s*>\s*.*$/,
      },
      // LaTeX 行内与块级公式 ($...$ 或 $$...$$)
      {
        className: 'formula',
        begin: /\${1,2}/,
        end: /\${1,2}/,
      },
    ],
  };
}
