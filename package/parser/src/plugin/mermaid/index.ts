// @ffm/parser/src/plugin/mermaid/index.ts
import { loadScript } from '#/plugin/loader';
import { createCodeBlockTransform } from '#/plugin/ast';
import type { AsyncRenderer, MarkdownPlugin } from '#/type';
import type { Mermaid, MermaidSource } from './type';

let sequence = 0;

// Build a Mermaid renderer with strict security enforced at initialization.
export const createMermaid = (
  source: MermaidSource,
): AsyncRenderer<Mermaid> => ({
  name: 'mermaid',
  selector: '[data-async="mermaid"]',
  style: source.style,
  async load() {
    const mermaid = await loadScript<Mermaid>(source.script, 'mermaid');
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict', // 启用严格安全模式，禁止脚本和事件
      suppressErrorRendering: true, // 禁用渲染时的语法错误提示
    });
    return mermaid;
  },
  async render(element, mermaid) {
    const code = element.textContent ?? '';
    if (!code.trim()) {
      element.textContent = '';
      return;
    }
    const { svg } = await mermaid.render(`ffm-mermaid-${sequence++}`, code);
    element.innerHTML = svg;
  },
});

export const mermaidTransform = createCodeBlockTransform('mermaid');

export const mermaidPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(mermaidTransform);
  parser.requireCapability('mermaid');
};
