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

/**
 * 统一规整语言标识符：转小写，并映射别名 (如 c++ -> cpp, TS -> typescript)
 */
export function getIdentifier(lang: string): string {
  const lower = lang.trim().toLowerCase();
  return highlightNameMap[lower] || lower;
}

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
export function getDisplayName(lang: string): string {
  if (!lang) return '';
  const lowerLang = lang.toLowerCase();
  // 优先使用特殊写法，否则自动将首字母大写
  return (
    displayNameMap[lowerLang] ||
    lowerLang.charAt(0).toUpperCase() + lowerLang.slice(1)
  );
}

/**
 * highlight.js 官方支持的语言权威列表。
 * 避免自定义语言出现加载错误的不专业控制台报错
 * 使用 Set 提供 O(1) 的高效查找。
 */
// prettier-ignore
export const supportHighlight = new Set([
  '1c', 'abnf', 'accesslog', 'actionscript', 'ada', 'angelscript', 'apache',
  'applescript', 'arcade', 'arduino', 'armasm', 'asciidoc', 'aspectj',
  'autohotkey', 'autoit', 'avrasm', 'awk', 'axapta', 'bash', 'basic', 'bnf',
  'brainfuck', 'c', 'cal', 'capnproto', 'ceylon', 'clean', 'clojure-repl',
  'clojure', 'cmake', 'coffeescript', 'coq', 'cos', 'cpp', 'crmsh', 'crystal',
  'csharp', 'csp', 'css', 'd', 'dart', 'delphi', 'diff', 'django', 'dns',
  'dockerfile', 'dos', 'dsconfig', 'dts', 'dust', 'ebnf', 'elixir', 'elm',
  'erb', 'erlang-repl', 'erlang', 'excel', 'fix', 'flix', 'fortran', 'fsharp',
  'gams', 'gauss', 'gcode', 'gherkin', 'glsl', 'gml', 'go', 'golo', 'gradle',
  'graphql', 'groovy', 'haml', 'handlebars', 'haskell', 'haxe', 'hsp',
  'http', 'hy', 'inform7', 'ini', 'irpf90', 'isbl', 'java', 'javascript',
  'jboss-cli', 'json', 'julia-repl', 'julia', 'kotlin', 'lasso', 'latex',
  'ldif', 'leaf', 'less', 'lisp', 'livecodeserver', 'livescript', 'llvm',
  'lsl', 'lua', 'makefile', 'markdown', 'mathematica', 'matlab', 'maxima',
  'mel', 'mercury', 'mipsasm', 'mizar', 'mojolicious', 'monkey', 'moonscript',
  'n1ql', 'nestedtext', 'nginx', 'nim', 'nix', 'node-repl', 'nsis',
  'objectivec', 'ocaml', 'openscad', 'oxygene', 'parser3', 'perl', 'pf',
  'pgsql', 'php-template', 'php', 'pony', 'powershell',
  'processing', 'profile', 'prolog', 'properties', 'protobuf', 'puppet',
  'purebasic', 'python-repl', 'python', 'q', 'qml', 'r', 'reasonml', 'rib',
  'roboconf', 'routeros', 'rsl', 'ruby', 'ruleslanguage', 'rust', 'sas',
  'scala', 'scheme', 'scilab', 'scss', 'shell', 'smali', 'smalltalk', 'sml',
  'sqf', 'sql', 'stan', 'stata', 'step21', 'stylus', 'subunit', 'swift',
  'taggerscript', 'tap', 'tcl', 'thrift', 'tp', 'twig', 'typescript',
  'vala', 'vbnet', 'vbscript-html', 'vbscript', 'verilog', 'vhdl', 'vim',
  'wasm', 'wren', 'x86asm', 'xl', 'xml', 'xquery', 'yaml', 'zephir',
  'ffm', 'fon', 'fer'
]);
