// @/composables/useMarkdownHighlighter.ts
import { computed, nextTick, watch, type Ref } from 'vue';

export function useMarkdownHighlighter(
  source: Ref<string>,
  highlightTarget: Ref<HTMLElement | null>,
) {
  const lines = computed(() => source.value.split('\n'));

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

  const removeCustomHighlights = () => {
    for (const name of tokenNames) window.CSS.highlights.delete(name);
  };

  // Updates CSS Custom Highlight ranges against mirrored text nodes.
  const updateCustomHighlights = () => {
    if (!highlightTarget.value) return;

    const lineNodes = highlightTarget.value.querySelectorAll(
      '.custom-highlight-target',
    );

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

    const addRange = (
      textNode: Text,
      category: string,
      start: number,
      end: number,
    ) => {
      if (start < 0 || end > textNode.length || start >= end) return;
      const range = new window.Range();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      tokens[category].push(range);
    };

    lineNodes.forEach((node) => {
      const textNode = node.firstChild;
      if (!(textNode instanceof window.Text)) return;
      const line = textNode.nodeValue ?? '';

      const heading = /^(#{1,6})(\s.*)$/.exec(line);
      const quote = /^(>\s)(.*)$/.exec(line);
      const list = /^(\s*)([-*+]|\d+\.)(\s)(.*)$/.exec(line);

      if (heading) {
        addRange(textNode, 'md-punctuation', 0, heading[1].length);
        addRange(textNode, 'md-heading', heading[1].length, line.length);
      } else if (quote) {
        addRange(textNode, 'md-punctuation', 0, quote[1].length);
        addRange(textNode, 'md-quote', quote[1].length, line.length);
      } else if (list) {
        const markerStart = list[1].length;
        const markerEnd = markerStart + list[2].length;
        addRange(textNode, 'md-punctuation', markerStart, markerEnd);
        addRange(textNode, 'md-list', markerEnd + list[3].length, line.length);
      } else if (line.startsWith('```')) {
        addRange(textNode, 'md-code-fence', 0, line.length);
      } else {
        const inlinePattern = /(\*\*.*?\*\*|\*.*?\*|`.*?`|--.*?--)/g;
        for (const match of line.matchAll(inlinePattern)) {
          const matchText = match[0];
          const matchStart = match.index ?? 0;
          const matchEnd = matchStart + matchText.length;

          if (matchText.startsWith('**')) {
            addRange(textNode, 'md-punctuation', matchStart, matchStart + 2);
            addRange(textNode, 'md-bold', matchStart + 2, matchEnd - 2);
            addRange(textNode, 'md-punctuation', matchEnd - 2, matchEnd);
          } else if (matchText.startsWith('*')) {
            addRange(textNode, 'md-punctuation', matchStart, matchStart + 1);
            addRange(textNode, 'md-italic', matchStart + 1, matchEnd - 1);
            addRange(textNode, 'md-punctuation', matchEnd - 1, matchEnd);
          } else if (matchText.startsWith('`')) {
            addRange(textNode, 'md-punctuation', matchStart, matchStart + 1);
            addRange(textNode, 'md-code', matchStart + 1, matchEnd - 1);
            addRange(textNode, 'md-punctuation', matchEnd - 1, matchEnd);
          } else if (matchText.startsWith('~~')) {
            addRange(textNode, 'md-punctuation', matchStart, matchStart + 2);
            addRange(textNode, 'md-strike', matchStart + 2, matchEnd - 2);
            addRange(textNode, 'md-punctuation', matchEnd - 2, matchEnd);
          }
        }
      }
    });

    removeCustomHighlights();
    for (const [name, ranges] of Object.entries(tokens)) {
      if (ranges.length > 0)
        window.CSS.highlights.set(name, new window.Highlight(...ranges));
    }
  };

  watch(
    [source, highlightTarget],
    () => {
      nextTick(updateCustomHighlights);
    },
    { immediate: true },
  );

  return {
    lines,
    updateCustomHighlights,
  };
}
