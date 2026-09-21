// @fuyeor/markdown-parser/src/plugins/highlight.ts
import type { ASTNode, ASTTransform, MarkdownPlugin } from '#/types';
import { mapAstNodes } from './ast';

const languageAliases: Record<string, string> = {
  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp',
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  yml: 'yaml',
  html: 'xml',
  md: 'markdown',
  rs: 'rust',
  rb: 'ruby',
  pl: 'perl',
  ps1: 'powershell',
  py: 'python',
};

// Normalize fenced-code aliases to the language names used by highlight.js.
export const normalizeHighlightLanguage = (rawLanguage: string): string => {
  const language = rawLanguage.trim().split(/\s+/u)[0]?.toLowerCase() ?? '';
  return languageAliases[language] ?? language;
};

export const highlightTransform: ASTTransform = (nodes) =>
  mapAstNodes(nodes, (node) => {
    if (node.type !== 'code_block') return node;

    const language = normalizeHighlightLanguage(String(node.lang ?? ''));
    return language && language !== node.lang
      ? { ...node, lang: language }
      : node;
  });

// Register language normalization for asynchronous highlight.js processing.
export const highlightPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(highlightTransform);
};
