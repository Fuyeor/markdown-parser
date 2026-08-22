// @fuyeor/markdown-parser-playground/src/composables/useMarkdownHighlighter.ts
import { computed, type Ref } from 'vue';
import { createFuyeorMarkdownParser, type Token } from '@fuyeor/markdown-parser';

export function useMarkdownHighlighter(source: Ref<string>) {
  // 我们使用独立的 parser 实例来解析高亮，以免影响主 AST（或者可以直接复用主 AST，但这里我们使用简单的 token 提取）
  // 实际上，为了实现实时着色，我们需要把 source 按行拆分，并在重叠的 textarea 下方渲染一个带高亮的层。
  
  const lines = computed(() => source.value.split('\n'));
  
  const lineNumbers = computed(() => {
    return lines.value.map((_, i) => i + 1);
  });

  // 由于 FFM parser 是块级解析器，为了实现类似 Prism/highlight.js 的实时高亮，
  // 我们可以在 Vue 模板中渲染一个和 textarea 完全重合的 div，
  // 里面包含带语法的文本。这里提供一个简单的正则高亮或直接复用 AST 渲染。
  // 为了性能和准确性，参考图中将 Markdown 语法符号置灰、标题/代码等高亮的做法，
  // 我们提供一个简化的基于正则的逐行着色器，或者你可以基于 AST 的 range 来着色。
  // 此处实现基于正则的轻量高亮，因为 AST 映射回原始字符 range 在当前版本较复杂。
  
  const highlightedLines = computed(() => {
    return lines.value.map(line => {
      let html = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // 标题
      if (/^#{1,6}\s/.test(html)) {
        html = html.replace(/^(#{1,6})(\s.*)$/, '<span class="hl-punctuation">$1</span><span class="hl-heading">$2</span>');
      } 
      // 引用
      else if (/^>\s/.test(html)) {
        html = html.replace(/^(>\s)(.*)$/, '<span class="hl-punctuation">$1</span><span class="hl-quote">$2</span>');
      }
      // 列表
      else if (/^(\s*)([-*+]|\d+\.)(\s)/.test(html)) {
        html = html.replace(/^(\s*)([-*+]|\d+\.)(\s)(.*)$/, '$1<span class="hl-punctuation">$2</span>$3<span class="hl-list">$4</span>');
      }
      // 代码块围栏
      else if (/^```/.test(html)) {
        html = `<span class="hl-punctuation hl-code-fence">${html}</span>`;
      }
      else {
        // 行内加粗、斜体、代码等
        html = html
          .replace(/(\*\*)(.*?)\1/g, '<span class="hl-punctuation">**</span><span class="hl-bold">$2</span><span class="hl-punctuation">**</span>')
          .replace(/(\*)(.*?)\1/g, '<span class="hl-punctuation">*</span><span class="hl-italic">$2</span><span class="hl-punctuation">*</span>')
          .replace(/(`)(.*?)\1/g, '<span class="hl-punctuation">`</span><span class="hl-code">$2</span><span class="hl-punctuation">`</span>')
          .replace(/(~~)(.*?)\1/g, '<span class="hl-punctuation">~~</span><span class="hl-strike">$2</span><span class="hl-punctuation">~~</span>');
      }

      // 保证空行有高度
      return html || ' ';
    });
  });

  return {
    lines,
    lineNumbers,
    highlightedLines,
  };
}
