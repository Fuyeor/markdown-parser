// @fuyeor/markdown-parser-playground/src/composables/useMarkdownHighlighter.ts
import { computed, nextTick, onMounted, watch, type Ref } from 'vue';

type CustomHighlightRegistry = {
  delete: (name: string) => void;
  set: (name: string, highlight: object) => void;
};

type CustomHighlightConstructor = new (...ranges: Range[]) => object;

const customHighlightStyles = `
::highlight(md-punctuation) { color: #a0aec0; }
::highlight(md-heading) { color: #553c9a; }
::highlight(md-quote) { color: #718096; }
::highlight(md-list) { color: #2d3748; }
::highlight(md-bold) { color: #1a202c; }
::highlight(md-italic) { color: #1a202c; }
::highlight(md-code) { color: #d53f8c; background-color: #faf5ff; }
::highlight(md-strike) { text-decoration: line-through; color: #a0aec0; }
::highlight(md-code-fence) { color: #805ad5; }
`;

const getCustomHighlightRegistry = (): CustomHighlightRegistry | null => {
  const css = Reflect.get(globalThis, 'CSS');
  const registry = css && Reflect.get(css, 'highlights');
  return registry && typeof registry.delete === 'function' && typeof registry.set === 'function'
    ? registry as CustomHighlightRegistry
    : null;
};

const getCustomHighlightConstructor = (): CustomHighlightConstructor | null => {
  const constructor = Reflect.get(globalThis, 'Highlight');
  return typeof constructor === 'function' ? constructor as CustomHighlightConstructor : null;
};

const ensureCustomHighlightStyles = () => {
  const styleId = 'fuyeor-playground-custom-highlight-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = customHighlightStyles;
  document.head.append(style);
};

export function useMarkdownHighlighter(
  source: Ref<string>,
  highlightTarget: Ref<HTMLElement | null>,
  supportsCustomHighlight: boolean,
) {
  const lines = computed(() => source.value.split('\n'));

  const lineNumbers = computed(() => {
    return lines.value.map((_, i) => i + 1);
  });

  // Keep a small regex fallback for browsers without the Custom Highlight API.
  const highlightedLines = computed(() => {
    if (supportsCustomHighlight) return [];

    return lines.value.map((line) => {
      let html = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (/^#{1,6}\s/.test(html)) {
        html = html.replace(/^(#{1,6})(\s.*)$/, '<span class="hl-punctuation">$1</span><span class="hl-heading">$2</span>');
      } else if (/^>\s/.test(html)) {
        html = html.replace(/^(>\s)(.*)$/, '<span class="hl-punctuation">$1</span><span class="hl-quote">$2</span>');
      } else if (/^(\s*)([-*+]|\d+\.)(\s)/.test(html)) {
        html = html.replace(/^(\s*)([-*+]|\d+\.)(\s)(.*)$/, '$1<span class="hl-punctuation">$2</span>$3<span class="hl-list">$4</span>');
      } else if (/^```/.test(html)) {
        html = `<span class="hl-punctuation hl-code-fence">${html}</span>`;
      } else {
        html = html
          .replace(/(\*\*)(.*?)\1/g, '<span class="hl-punctuation">**</span><span class="hl-bold">$2</span><span class="hl-punctuation">**</span>')
          .replace(/(\*)(.*?)\1/g, '<span class="hl-punctuation">*</span><span class="hl-italic">$2</span><span class="hl-punctuation">*</span>')
          .replace(/(`)(.*?)\1/g, '<span class="hl-punctuation">`</span><span class="hl-code">$2</span><span class="hl-punctuation">`</span>')
          .replace(/(~~)(.*?)\1/g, '<span class="hl-punctuation">~~</span><span class="hl-strike">$2</span><span class="hl-punctuation">~~</span>');
      }

      return html || ' ';
    });
  });

  const tokenNames = [
    'md-punctuation',
    'md-heading',
    'md-quote',
    'md-list',
    'md-bold',
    'md-italic',
    'md-code',
    'md-strike',
    'md-code-fence',
  ];

  const removeCustomHighlights = (registry: CustomHighlightRegistry) => {
    for (const name of tokenNames) registry.delete(name);
  };

  // Rebuild ranges against the mirrored text node without replacing editor DOM.
  const updateCustomHighlights = () => {
    if (!supportsCustomHighlight || !highlightTarget.value) return;

    const registry = getCustomHighlightRegistry();
    const Highlight = getCustomHighlightConstructor();
    const textNode = highlightTarget.value.firstChild;

    if (!registry || !Highlight || !(textNode instanceof Text)) {
      if (registry) removeCustomHighlights(registry);
      return;
    }

    const text = textNode.nodeValue ?? '';
    const tokens: Record<string, Range[]> = {
      'md-punctuation': [],
      'md-heading': [],
      'md-quote': [],
      'md-list': [],
      'md-bold': [],
      'md-italic': [],
      'md-code': [],
      'md-strike': [],
      'md-code-fence': [],
    };

    const addRange = (category: string, start: number, end: number) => {
      if (start < 0 || end > text.length || start >= end) return;

      const range = new Range();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      tokens[category].push(range);
    };

    let currentPosition = 0;
    for (const line of text.split('\n')) {
      const lineStart = currentPosition;
      const heading = /^(#{1,6})(\s.*)$/.exec(line);
      const quote = /^(>\s)(.*)$/.exec(line);
      const list = /^(\s*)([-*+]|\d+\.)(\s)(.*)$/.exec(line);

      if (heading) {
        addRange('md-punctuation', lineStart, lineStart + heading[1].length);
        addRange('md-heading', lineStart + heading[1].length, lineStart + line.length);
      } else if (quote) {
        addRange('md-punctuation', lineStart, lineStart + quote[1].length);
        addRange('md-quote', lineStart + quote[1].length, lineStart + line.length);
      } else if (list) {
        const markerStart = lineStart + list[1].length;
        const markerEnd = markerStart + list[2].length;
        addRange('md-punctuation', markerStart, markerEnd);
        addRange('md-list', markerEnd + list[3].length, lineStart + line.length);
      } else if (line.startsWith('```')) {
        addRange('md-code-fence', lineStart, lineStart + line.length);
      } else {
        const inlinePattern = /(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~)/g;
        for (const match of line.matchAll(inlinePattern)) {
          const matchText = match[0];
          const matchStart = lineStart + (match.index ?? 0);
          const matchEnd = matchStart + matchText.length;

          if (matchText.startsWith('**')) {
            addRange('md-punctuation', matchStart, matchStart + 2);
            addRange('md-bold', matchStart + 2, matchEnd - 2);
            addRange('md-punctuation', matchEnd - 2, matchEnd);
          } else if (matchText.startsWith('*')) {
            addRange('md-punctuation', matchStart, matchStart + 1);
            addRange('md-italic', matchStart + 1, matchEnd - 1);
            addRange('md-punctuation', matchEnd - 1, matchEnd);
          } else if (matchText.startsWith('`')) {
            addRange('md-punctuation', matchStart, matchStart + 1);
            addRange('md-code', matchStart + 1, matchEnd - 1);
            addRange('md-punctuation', matchEnd - 1, matchEnd);
          } else if (matchText.startsWith('~~')) {
            addRange('md-punctuation', matchStart, matchStart + 2);
            addRange('md-strike', matchStart + 2, matchEnd - 2);
            addRange('md-punctuation', matchEnd - 2, matchEnd);
          }
        }
      }

      currentPosition += line.length + 1;
    }

    removeCustomHighlights(registry);
    for (const [name, ranges] of Object.entries(tokens)) {
      if (ranges.length > 0) registry.set(name, new Highlight(...ranges));
    }
  };

  if (supportsCustomHighlight) {
    onMounted(ensureCustomHighlightStyles);
    watch([source, highlightTarget], () => {
      void nextTick(updateCustomHighlights);
    }, { immediate: true });
  }

  return {
    lines,
    lineNumbers,
    highlightedLines,
    updateCustomHighlights,
  };
}

export { customHighlightStyles };
