<!-- @/views/Home.vue -->
<template>
  <section class="playground-layout">
    <article class="section editor">
      <MarkdownToolbar
        :can-undo="canUndo"
        :can-redo="canRedo"
        @undo="undo"
        @redo="redo"
        @format="formatDocument"
        @tool="applyTool"
      />
      <div class="editor-scroll-container" @scroll="syncScroll" ref="scrollContainer">
        <div class="editor-line-numbers" aria-hidden="true">
          <div v-for="n in lineNumbers" :key="n" class="line-number">{{ n }}</div>
        </div>
        <div class="editor-content-wrapper">
          <div class="editor-highlight-layer" aria-hidden="true">
            <div v-for="(html, i) in highlightedLines" :key="i" class="highlight-line" v-html="html"></div>
          </div>
          <textarea
            ref="editor"
            v-model="source"
            spellcheck="false"
            class="editor-textarea"
            @input="recordInput"
            @scroll="syncTextareaScroll"
          />
        </div>
      </div>
    </article>

    <article class="section preview">
      <Tabs
        :tabs="tabs"
        :active-tab-value="activeTab"
        :is-router-nav="false"
        @tab-click="activeTab = $event"
      >
        <template #preview>{{ t('playground.preview.render') }}</template>
        <template #ast>JSON/AST</template>
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
import MarkdownToolbar from '@/components/Playground/MarkdownToolbar.vue';

import { computed, h, ref, watch, onMounted } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { Tabs, type TabItem } from '@fuyeor/interactify';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';
import { fetchExample } from '@/api/examples';
import { decodeSnippet } from '@/composables/useCompression';
import { useMarkdownEditor } from '@/composables/useMarkdownEditor';
import { usePlaygroundSource } from '@/composables/usePlaygroundSource';
import { useMarkdownHighlighter } from '@/composables/useMarkdownHighlighter';

const { t, locale } = useLocale();
const { source } = usePlaygroundSource();

const editor = ref<HTMLTextAreaElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const activeTab = ref('preview');

const { lineNumbers, highlightedLines } = useMarkdownHighlighter(source);

const syncScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (editor.value) {
    // 同步 textarea 滚动，或者我们通过 CSS 把 textarea 撑开不让它自己滚动
  }
};

const syncTextareaScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = target.scrollTop;
  }
};
const tabs: TabItem[] = [
  { value: 'preview' },
  { value: 'ast' },
  { value: 'html' },
];

const {
  canUndo,
  canRedo,
  replaceSource,
  recordInput,
  applyTool,
  formatDocument,
  undo,
  redo,
} = useMarkdownEditor(source, editor);

watch(
  locale,
  (newLocale) => {
    if (window.location.hash.startsWith('#snippet=')) return;
    void fetchExample(newLocale).then(replaceSource);
  },
  { immediate: true },
);

onMounted(() => {
  const hash = window.location.hash;
  if (hash.startsWith('#snippet=')) {
    const snippet = hash.slice('#snippet='.length);
    void decodeSnippet(snippet).then((decoded) => {
      if (decoded) replaceSource(decoded);
    });
  }
});

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', renderToVue(ast.value)),
}));
</script>

<style>
.editor-toolbar,
.tab-container {
  height: 3rem;
  border-bottom: var(--border-subtle);
}

.editor-scroll-container {
  display: flex;
  flex: 1;
  overflow: auto;
  background: var(--bg-primary, #ffffff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
}

.editor-line-numbers {
  padding: 16px 12px;
  text-align: right;
  color: #a0aec0;
  user-select: none;
  border-right: 1px solid #edf2f7;
  background: #f8fafc;
}

.line-number {
  min-height: 1.6em;
}

.editor-content-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.editor-highlight-layer,
.editor-textarea {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 16px;
  margin: 0;
  border: 0;
  box-sizing: border-box;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.editor-highlight-layer {
  pointer-events: none;
  z-index: 1;
}

.highlight-line {
  min-height: 1.6em;
  color: #1a202c;
}

.editor-textarea {
  color: transparent;
  background: transparent;
  caret-color: #2b6cb0;
  resize: none;
  outline: none;
  overflow: hidden;
  z-index: 2;
}

/* Make selection visible on the transparent textarea */
.editor-textarea::selection {
  background: rgba(43, 108, 176, 0.25);
  color: transparent;
}

/* Highlighting tokens */
.hl-punctuation { color: #a0aec0; }
.hl-heading { color: #553c9a; font-weight: 600; }
.hl-quote { color: #718096; font-style: italic; }
.hl-list { color: #2d3748; }
.hl-bold { font-weight: 700; color: #1a202c; }
.hl-italic { font-style: italic; color: #1a202c; }
.hl-code { color: #d53f8c; background: #faf5ff; border-radius: 3px; padding: 0 2px; }
.hl-strike { text-decoration: line-through; color: #a0aec0; }
.hl-code-fence { color: #805ad5; }
</style>
