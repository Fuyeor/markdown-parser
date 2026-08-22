// @fuyeor/markdown-parser-playground/src/components/Playground/useMarkdownEditor.ts
import { computed, nextTick, ref, type Ref } from 'vue';
import { format as formatMarkdown } from '@fuyeor/markdown-formatter';

export type MarkdownTool =
  | 'bold'
  | 'italic'
  | 'heading'
  | 'strike'
  | 'unordered-list'
  | 'ordered-list'
  | 'checklist'
  | 'quote'
  | 'code'
  | 'link'
  | 'table';

export function useMarkdownEditor(
  source: Ref<string>,
  editor: Ref<HTMLTextAreaElement | null>,
) {
  const history = ref([source.value]);
  const historyIndex = ref(0);
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  // Keep the editor history bounded so repeated formatting does not grow memory indefinitely.
  const recordHistory = (value: string) => {
    const nextHistory = history.value.slice(0, historyIndex.value + 1);
    if (nextHistory.at(-1) === value) return;
    nextHistory.push(value);
    if (nextHistory.length > 100) nextHistory.shift();
    history.value = nextHistory;
    historyIndex.value = nextHistory.length - 1;
  };

  const replaceSource = (value: string) => {
    source.value = value;
    history.value = [value];
    historyIndex.value = 0;
  };

  const recordInput = () => recordHistory(source.value);

  const setSource = (value: string, selectionStart: number, selectionEnd: number) => {
    source.value = value;
    recordHistory(value);
    void nextTick(() => {
      editor.value?.focus();
      editor.value?.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const applyTool = (tool: MarkdownTool) => {
    const element = editor.value;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const text = source.value.slice(start, end);
    const fallback = text || 'text';
    let replacement = fallback;

    if (tool === 'bold') replacement = `**${fallback}**`;
    if (tool === 'italic') replacement = `*${fallback}*`;
    if (tool === 'strike') replacement = `~~${fallback}~~`;
    if (tool === 'code') replacement = `\`${fallback}\``;
    if (tool === 'link') replacement = `[${fallback}](https://example.com)`;
    if (tool === 'heading') replacement = `# ${fallback}`;
    if (tool === 'quote') replacement = fallback.split('\n').map((line) => `> ${line}`).join('\n');
    if (tool === 'unordered-list') replacement = fallback.split('\n').map((line) => `- ${line}`).join('\n');
    if (tool === 'ordered-list') replacement = fallback.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
    if (tool === 'checklist') replacement = fallback.split('\n').map((line) => `- [ ] ${line}`).join('\n');
    if (tool === 'table') replacement = '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |';

    const selectionStart = text ? start : start + replacement.length;
    const selectionEnd = text ? start + replacement.length : selectionStart;
    setSource(`${source.value.slice(0, start)}${replacement}${source.value.slice(end)}`, selectionStart, selectionEnd);
  };

  const formatDocument = () => {
    const formatted = formatMarkdown(source.value);
    if (formatted === source.value) return;
    setSource(formatted, 0, 0);
  };

  const undo = () => {
    if (!canUndo.value) return;
    historyIndex.value -= 1;
    source.value = history.value[historyIndex.value];
  };

  const redo = () => {
    if (!canRedo.value) return;
    historyIndex.value += 1;
    source.value = history.value[historyIndex.value];
  };

  return {
    canUndo,
    canRedo,
    replaceSource,
    recordInput,
    applyTool,
    formatDocument,
    undo,
    redo,
  };
}
