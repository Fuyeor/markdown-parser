// @ffm/parser/src/plugin/highlight/language/fer.ts
import type { Language } from '#/plugin/highlight/type';

/**
 * Highlight.js grammar definition for Fer Programming Language.
 */
export default function fer(hljs: any): Language {
  return {
    name: 'Fer',
    keywords: {
      keyword: 'struct enum exports',
      type: 'i8 i16 i32 i64 i128 u8 u16 u32 u64 u128 f32 f64 bool string char byte int float',
      literal: 'true false',
      operator:
        'and or not in contains matches starts ends less more least most equals',
    },
    contains: [
      // 注释支持 (//, /* */, ///)
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      // 反引号字符串，内嵌逃逸符与 {...} 变量插值
      {
        className: 'string',
        begin: /`/,
        end: /`/,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          {
            className: 'subst',
            begin: /\{/,
            end: /\}/,
          },
        ],
      },
      // 数字
      {
        className: 'number',
        begin: /\b[0-9]+\b/,
      },
      // 类型定义 (如 CustomType: struct)
      {
        className: 'type',
        // 必须以大写开头，后面可以跟着小写，并且可以重复这种“大写+小写”的结构
        begin: /\b[A-Z][a-z0-9\-]+([A-Z][a-z0-9\-]+)*\b/,
      },
      // 函数调用 (function-name()
      {
        className: 'title.function',
        begin: /\b[a-z0-9\-]+\s*(?=\()/,
      },
      // 常量 / 变量赋值 (var-name =)
      {
        className: 'property',
        begin: /\b[a-z][a-z0-9\-]*\s*(?=\=)/,
      },
      // 运算符与赋值符 (->, =>, =, <=, >=, <, >)
      {
        className: 'operator',
        begin: /(->|=>|<=|>=|=|<|>)/,
      },
      // 标点界定符
      {
        className: 'punctuation',
        begin: /[{}()\[\],]/,
      },
    ],
  };
}
