// @ffm/parser/src/plugin/highlight/index.ts
import { mapAstNode } from '#/plugin/ast';
import { loadModule } from '#/plugin/loader';
import { getDisplayLanguageName } from './util';
import type { ASTTransform, AsyncRenderer, MarkdownPlugin } from '#/type';
import type { Highlight, HighlightSource } from './type';

// Extend the Window interface to include our highlight property
declare global {
  interface Window {
    // highlight.js 硬编码查找叫 `window.hljs` 的对象
    hljs?: Highlight;
  }
}

export const highlightTransform: ASTTransform = (nodes) =>
  mapAstNode(nodes, (node) => {
    if (node.type !== 'code') return node;

    const language = getDisplayLanguageName(String(node.lang ?? ''));
    return language && language !== node.lang
      ? { ...node, lang: language }
      : node;
  });

// Build a highlight.js renderer driven by `data-language` and a language registry.
export const createHighlight = (
  source: HighlightSource,
): AsyncRenderer<Highlight> => ({
  name: 'hljs',
  selector: '[data-async="hljs"]',
  style: source.style,
  async load() {
    const hljs = await loadModule<Highlight>(source.script, 'hljs');
    hljs.configure({ ignoreUnescapedHTML: true });
    // Some language modules register themselves against the global hljs.
    window.hljs = hljs;
    return hljs;
  },
  async render(element, hljs) {
    const language = element.dataset.language;
    if (!language) return;

    const code = element.querySelector('code');
    if (!code) return;

    if (!hljs.getLanguage(language) && source.language?.[language]) {
      const module = await source.language[language]();
      hljs.registerLanguage(language, module.default);
    }
    hljs.highlightElement(code);
  },
});

// Register language normalization for asynchronous highlight.js processing.
export const highlightPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(highlightTransform);
  parser.requireCapability('hljs');
};
