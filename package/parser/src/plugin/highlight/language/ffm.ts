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
      // 表格分隔行：必须放在删除线之前，整行吃掉
      {
        className: 'table',
        begin: /^(?=.*\|)(?=[\s:|-]*-{3,})[\s:|-]+$/,
        contains: [],
      },
      // 仅支持 ATX 风格标题 (# ## ###)
      {
        className: 'section',
        begin: /^#{1,6}\s+.*$/,
      },
      // FFM 特殊块：一次性匹配整个块
      // \1 = 反引号串，正则内部反向引用，精确匹配同数量的结束反引号
      {
        className: 'meta',
        begin:
          /(`{3,4})(slide|chain|accordion|quote|mermaid|smiles|abc)\b[^\n]*\n[\s\S]*?\n\1(?!`)/,
      },
      // 通用栅栏代码块 (```)
      // 用字符串 '\\1' 匹配组 1 (N 个反引号)
      {
        className: 'code',
        begin: /(`{3,})[^\n]*\n[\s\S]*?\n\1(?!`)/,
      },
      // 行内代码 (`code`)
      // 一次性匹配，不跨行，不会吞后续内容
      {
        className: 'code',
        begin: /`[^`\n]+`/,
      },
      // 删除线 (--strikethrough--)
      // 排除 --- 水平线/表格分隔行
      {
        className: 'deletion',
        begin: /(?<!-)--(?!-)/,
        end: /(?<!-)--(?!-)/,
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
      // LaTeX 块级公式
      {
        className: 'formula',
        begin: /\$\$/,
        end: /\$\$/,
      },
      // LaTeX 行内公式
      {
        className: 'formula',
        begin: /(?<!\$)\$(?!\$)/,
        end: /(?<!\$)\$(?!\$)/,
      },
    ],
  };
}
