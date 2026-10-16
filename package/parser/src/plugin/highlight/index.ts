// @ffm/parser/src/plugin/highlight/index.ts
import { loadModule, loadSideEffectScript } from '@fuyeor/util';
import { mapAstNode } from '#/plugin/ast';
import { getDisplayName, getIdentifier, supportHighlight } from './util';
import type { ASTTransform, AsyncRenderer, MarkdownPlugin } from '#/type';
import type { Highlight, HighlightSource } from './type';

// Extend the Window interface to include our highlight property
declare global {
  interface Window {
    // highlight.js 硬编码查找叫 `window.hljs` 的对象
    hljs?: Highlight;
  }
}

// 内置语言懒加载映射表（Vite 自动打包为独立 Chunk 文件）
const builtIn: Record<string, () => Promise<{ default: any }>> = {
  ffm: () => import('./language/ffm'),
  fon: () => import('./language/fon'),
  fer: () => import('./language/fer'),
};

export const highlightTransform: ASTTransform = (nodes) =>
  mapAstNode(nodes, (node) => {
    if (node.type !== 'code') return node;

    const normalized = getIdentifier(node.lang || '');
    const display = getDisplayName(normalized || 'Text');

    return {
      ...node,
      lang: normalized,
      // attach display name in AST
      displayName: display,
    };
  });

// Build a highlight.js renderer driven by `data-language` and a language registry.
export const createHighlight = (
  source: HighlightSource,
): AsyncRenderer<Highlight> => ({
  name: 'hljs',
  selector: '[data-async="hljs"]',
  style: source.style,
  async load() {
    // 加载 ESM 模块并从中获取默认导出的 highlight 对象
    const module = await loadModule<{ default: Highlight }>(source.script);
    const highlight = module.default as Highlight;

    // 关键：将核心 highlight 对象暴露到全局，以便语言包脚本能够找到它
    if (!window.hljs) window.hljs = highlight;

    // 配置已在全局加载的 highlight 实例
    if (highlight?.isInitialized) {
      highlight.configure({ ignoreUnescapedHTML: true }); // 忽略未转义HTML的安全警告
      highlight.isInitialized = true; // 添加标记防止重复配置
    }

    return highlight;
  },
  async render(element, hljs) {
    // 从 <pre> 元素上获取语言
    const language = element.dataset.language;
    if (!language) return;

    // 找到内部的 <code> 元素进行高亮
    const code = element.querySelector('code');
    if (!code) return;

    // 如果语言尚未注册，则动态加载
    if (!hljs.getLanguage(language)) {
      // 优先本地注册表（内置 ffm/fon/fer 或 source.register）
      const localLoader = builtIn[language] || source.register?.[language];
      if (localLoader) {
        const module = await localLoader();
        hljs.registerLanguage(language, module.default);
      }
      // 外部 CDN 语言加载
      else if (supportHighlight.has(language) && source.language) {
        await loadSideEffectScript(source.language(language));
      }
    }

    // 再次检查语言是否已成功加载并注册
    if (hljs.getLanguage(language)) {
      hljs.highlightElement(code); // 高亮 <code> 元素
    }
  },
});

// Register language normalization for asynchronous highlight.js processing.
export const highlightPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(highlightTransform);
  parser.requireCapability('hljs');
};
