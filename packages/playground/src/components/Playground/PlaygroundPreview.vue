<!-- @/components/Playground/PlaygroundPreview.vue -->
<template>
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
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { Tabs, type TabItem } from '@fuyeor/interactify';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';
import { usePlaygroundSource } from '@/composables/usePlaygroundSource';

const { t } = useLocale();
const { source } = usePlaygroundSource();
const activeTab = ref('preview');
const tabs: TabItem[] = [
  { value: 'preview' },
  { value: 'ast' },
  { value: 'html' },
];

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', renderToVue(ast.value)),
}));
</script>

<style>
.preview {
  overflow: hidden;
  border-left: 1px solid var(--border-subtle, #e2e8f0);
}

.output-content {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 24px;
  background-color: var(--surface-raised-hover);
}

.markdown-rendered {
  max-width: 900px;
  margin: 0 auto;
}

.output-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
