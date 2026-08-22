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
      <textarea
        ref="editor"
        v-model="source"
        spellcheck="false"
        @input="recordInput"
      />
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

const { t, locale } = useLocale();
const { source } = usePlaygroundSource();

const editor = ref<HTMLTextAreaElement | null>(null);
const activeTab = ref('preview');
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
</style>
