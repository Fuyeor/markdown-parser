// @/composables/useMarkdownEditor.ts
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

  const setSource = (
    value: string,
    selectionStart: number,
    selectionEnd: number,
    scrollTop?: number,
  ) => {
    const element = editor.value;
    if (element) {
      element.focus();
      // 使用 document.execCommand 来触发原生的输入事件，这样可以被 Ctrl+Z 撤销
      // 由于 execCommand 已经被弃用但依然是所有浏览器支持插入文本且进入撤销栈的唯一标准方式
      // 我们全选后替换来更新整个值，或只替换选区
      element.select();
      const success = document.execCommand('insertText', false, value);

      // 如果 execCommand 失败（某些环境可能禁用），回退到直接赋值
      if (!success) {
        source.value = value;
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      source.value = value;
    }

    recordHistory(value);
    void nextTick(() => {
      if (!element) return;
      element.focus();
      element.setSelectionRange(selectionStart, selectionEnd);
      if (scrollTop !== undefined) {
        element.scrollTop = scrollTop;
      }
    });
  };

  const applyTool = (tool: MarkdownTool) => {
    const element = editor.value;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const text = source.value.slice(start, end);
    const fallback = text || 'text';

    // 检查成对包裹语法是否已经存在
    const toggleWrap = (prefix: string, suffix: string = prefix) => {
      const isWrapped =
        text.startsWith(prefix) &&
        text.endsWith(suffix) &&
        text.length >= prefix.length + suffix.length;
      if (isWrapped) {
        // 取消包裹
        return text.slice(prefix.length, text.length - suffix.length);
      }
      // 添加包裹
      return `${prefix}${fallback}${suffix}`;
    };

    let replacement = fallback;

    if (tool === 'bold') replacement = toggleWrap('**');
    else if (tool === 'italic') replacement = toggleWrap('*');
    else if (tool === 'strike') replacement = toggleWrap('~~');
    else if (tool === 'code') replacement = toggleWrap('`');
    else if (tool === 'link')
      replacement = `[${fallback}](https://example.com)`;
    else if (tool === 'heading') replacement = `# ${fallback}`;
    else if (tool === 'quote')
      replacement = fallback
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    else if (tool === 'unordered-list')
      replacement = fallback
        .split('\n')
        .map((line) => `- ${line}`)
        .join('\n');
    else if (tool === 'ordered-list')
      replacement = fallback
        .split('\n')
        .map((line, index) => `${index + 1}. ${line}`)
        .join('\n');
    else if (tool === 'checklist')
      replacement = fallback
        .split('\n')
        .map((line) => `- [ ] ${line}`)
        .join('\n');
    else if (tool === 'table')
      replacement = '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |';

    const selectionStart = text ? start : start + replacement.length;
    const selectionEnd = text ? start + replacement.length : selectionStart;

    // 如果工具栏触发时不需要替换全部文档，我们可以只选中文本并执行 insertText 替换选区
    // 这样能保留更细粒度的 Ctrl+Z 历史
    element.focus();
    element.setSelectionRange(start, end);
    const success = document.execCommand('insertText', false, replacement);

    if (!success) {
      // 降级策略
      setSource(
        `${source.value.slice(0, start)}${replacement}${source.value.slice(end)}`,
        selectionStart,
        selectionEnd,
        element.scrollTop,
      );
    } else {
      recordInput();
      void nextTick(() => {
        element.focus();
        element.setSelectionRange(selectionStart, selectionEnd);
      });
    }
  };

  const formatDocument = () => {
    const formatted = formatMarkdown(source.value);
    if (formatted === source.value) return;

    const element = editor.value;
    if (element) {
      setSource(
        formatted,
        element.selectionStart,
        element.selectionEnd,
        element.scrollTop,
      );
    } else {
      setSource(formatted, 0, 0);
    }
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
