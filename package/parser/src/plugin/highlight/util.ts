// @ffm/parser/src/plugin/highlight/util.ts

/**
 * 语言别名映射表，用于统一请求 CDN 语言标识符。
 */
export const highlightNameMap: Record<string, string> = {
  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp',
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  yml: 'yaml',
  html: 'xml', // 官方没有 html
  md: 'markdown',
  rs: 'rust',
  rb: 'ruby',
  pl: 'perl',
  ps1: 'powershell',
  py: 'python',
} as const;

// 一个小型的、针对特殊写法的映射表
const displayNameMap: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',

  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',

  yaml: 'YAML',
  svg: 'SVG',

  cpp: 'C++',
  csharp: 'C#',
  objectivec: 'Objective-C',

  php: 'PHP',
  vbnet: 'VB.NET',

  sql: 'SQL',
  pgsql: 'PostgreSQL',

  x86asm: 'x86 Assembly',
  armasm: 'ARM Assembly',
  mipsasm: 'MIPS Assembly',

  ffm: 'Fuyeor Flavored Markdown',
  fon: 'FON',
} as const;

// 语言显示名称工具
export function getDisplayLanguageName(lang: string): string {
  if (!lang) return '';
  const lowerLang = lang.toLowerCase();
  // 优先使用特殊写法，否则自动将首字母大写
  return (
    displayNameMap[lowerLang] ||
    lowerLang.charAt(0).toUpperCase() + lowerLang.slice(1)
  );
}
