<!-- @fuyeor/markdown-parser-playground/src/views/Home.vue -->
<template>
  <header class="topbar">
    <LocaleSwitcher
      :supported-locales="SUPPORTED_LOCALES"
      @change="handleLocaleChange"
    />
  </header>

  <section class="editor-output-layout" aria-label="Markdown parser playground">
    <article class="pane editor-pane">
      <header class="pane-header">
        <span>01</span>
        <h2>{{ t('editor.source') }}</h2>
      </header>
      <nav class="editor-toolbar" aria-label="Markdown formatting toolbar">
        <button type="button" :disabled="!canUndo" title="Undo" @click="undo">↶</button>
        <button type="button" :disabled="!canRedo" title="Redo" @click="redo">↷</button>
        <span class="toolbar-divider" aria-hidden="true" />
        <button type="button" title="Format Document" @click="formatDocument">✨</button>
        <span class="toolbar-divider" aria-hidden="true" />
        <button type="button" title="Bold" @click="applyTool('bold')"><strong>B</strong></button>
        <button type="button" title="Italic" @click="applyTool('italic')"><em>I</em></button>
        <button type="button" title="Heading" @click="applyTool('heading')">H</button>
        <button type="button" title="Strikethrough" @click="applyTool('strike')"><s>S</s></button>
        <button type="button" title="Unordered list" @click="applyTool('unordered-list')">☷</button>
        <button type="button" title="Ordered list" @click="applyTool('ordered-list')">№</button>
        <button type="button" title="Checklist" @click="applyTool('checklist')">☑</button>
        <button type="button" title="Blockquote" @click="applyTool('quote')">❯</button>
        <button type="button" title="Code" @click="applyTool('code')">&lt;/&gt;</button>
        <button type="button" title="Link" @click="applyTool('link')">↗</button>
        <button type="button" title="Table" @click="applyTool('table')">▦</button>
      </nav>
      <textarea
        ref="editor"
        v-model="source"
        spellcheck="false"
        @input="recordInput"
      />
    </article>

    <article class="pane output-pane">
      <Tabs
        :tabs="tabs"
        :active-tab-value="activeTab"
        :is-router-nav="false"
        container-class="output-tabs"
        @tab-click="activeTab = $event"
      >
        <template #preview>{{ t('preview.render') }}</template>
        <template #ast>JSON (AST)</template>
        <template #html>HTML</template>
      </Tabs>
      <div class="output-content">
        <div v-if="activeTab === 'preview'" class="markdown-rendered">
          <component :is="previewComponent" />
        </div>
        <pre v-else-if="activeTab === 'ast'">{{ astJson }}</pre>
        <pre v-else>{{ renderedHtml }}</pre>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, h, nextTick, ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { LocaleSwitcher, Tabs, type TabItem } from '@fuyeor/interactify';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@fuyeor/markdown-parser';
import { format as formatMarkdown } from '@fuyeor/markdown-formatter';
import { renderToVue } from '@fuyeor/markdown-parser-vue';
import { SUPPORTED_LOCALES } from '../config/locales';
import { fetchExample } from '../api/examples';

const { t, locale } = useLocale();
const route = useRoute();
const router = useRouter();
const editor = ref<HTMLTextAreaElement | null>(null);
const source = ref('');
const activeTab = ref('preview');
const history = ref([source.value]);
const historyIndex = ref(0);
const tabs: TabItem[] = [
  { value: 'preview' },
  { value: 'ast' },
  { value: 'html' },
];

// 异步加载对应语言的示例文本
import { watch } from 'vue';
watch(locale, (newLocale) => {
  void fetchExample(newLocale).then((exampleText) => {
    source.value = exampleText;
    history.value = [exampleText];
    historyIndex.value = 0;
  });
}, { immediate: true });

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

const recordInput = () => recordHistory(source.value);

const setSource = (value: string, selectionStart: number, selectionEnd: number) => {
  source.value = value;
  recordHistory(value);
  void nextTick(() => {
    editor.value?.focus();
    editor.value?.setSelectionRange(selectionStart, selectionEnd);
  });
};

const selectedText = () => {
  const element = editor.value;
  if (!element) return { start: 0, end: 0, text: '' };
  return {
    start: element.selectionStart,
    end: element.selectionEnd,
    text: source.value.slice(element.selectionStart, element.selectionEnd),
  };
};

const applyTool = (tool: string) => {
  const { start, end, text } = selectedText();
  const fallback = text || 'text';
  let replacement = fallback;
  let nextStart = start;
  let nextEnd = start + replacement.length;

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

  nextEnd = start + replacement.length;
  if (!text) nextStart = start + replacement.length;
  setSource(`${source.value.slice(0, start)}${replacement}${source.value.slice(end)}`, nextStart, nextEnd);
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

const formatDocument = () => {
  const formatted = formatMarkdown(source.value);
  if (formatted === source.value) return;
  setSource(formatted, 0, 0);
};

const handleLocaleChange = (newLocale: string) => {
  if (!SUPPORTED_LOCALES.includes(newLocale as (typeof SUPPORTED_LOCALES)[number])) return;
  router.replace({ name: route.name, params: { locale: newLocale } });
};

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', renderToVue(ast.value)),
}));
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: flex-end;
  margin: 20px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 42px;
  padding: 4px 10px;
  border-bottom: 1px solid #edf0f2;
  background: #fbfcfd;
  overflow-x: auto;
}

.editor-toolbar button {
  display: grid;
  min-width: 30px;
  height: 30px;
  place-items: center;
  padding: 0 7px;
  border: 0;
  border-radius: 6px;
  color: #53606d;
  background: transparent;
  font: 600 13px ui-monospace, monospace;
  cursor: pointer;
}

.editor-toolbar button:hover:not(:disabled) { color: #3855ae; background: #edf1ff; }
.editor-toolbar button:disabled { color: #c7cdd3; cursor: not-allowed; }
.toolbar-divider { width: 1px; height: 22px; margin: 0 5px; background: #dfe4e8; }
</style>
