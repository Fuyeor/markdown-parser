// @ffm/parser/src/plugin/mermaid/index.ts
import { loadScript, sanitizeHtml } from '@fuyeor/util';
import { createCodeBlockTransform } from '#/plugin/ast';
import type { AsyncRenderer, MarkdownPlugin } from '#/type';
import type { Mermaid, MermaidSource } from './type';

let sequence = 0;

export const mermaidTransform = createCodeBlockTransform('mermaid');

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
    const code = element.textContent
      // 替换换行符（是因为 `<br>` 会导致 photoswipe 无法渲染图片）
      .replace(/<\s*br\s*\/?>/gi, '\n');

    // 输入净化：在代码交给 Mermaid 之前，剥离所有 HTML 标签，只留下纯文本
    // 防止 img 标签 XSS 问题，需移除全部标签
    const cleanCode = sanitizeHtml(code, 'text');

    // 如果清洗后为空，则直接终止，避免 Mermaid 崩溃
    if (!cleanCode.trim()) {
      element.replaceChildren(); // 清空占位符，行为与渲染失败保持一致
      return; // 提前退出
    }

    try {
      // 输出净化：使用绝对干净的代码进行解析和渲染
      await mermaid.parse(cleanCode);
      const { svg } = await mermaid.render(
        `ffm-mermaid-${sequence++}`,
        cleanCode,
      );

      // 使用 svg 模式清洗输出
      element.innerHTML = sanitizeHtml(svg, 'svg');
    } catch {
      element.replaceChildren();
    }
  },
});

export const mermaidPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(mermaidTransform);
  parser.requireCapability('mermaid');
};
