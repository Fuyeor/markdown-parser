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
import { computed, h, ref, watch } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { LocaleSwitcher, Tabs, type TabItem } from '@fuyeor/interactify';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';
import MarkdownToolbar from '../components/Playground/MarkdownToolbar.vue';
import { useMarkdownEditor } from '../components/Playground/useMarkdownEditor';
import { SUPPORTED_LOCALES } from '../config/locales';
import { fetchExample } from '../api/examples';

const { t, locale } = useLocale();
const route = useRoute();
const router = useRouter();
const editor = ref<HTMLTextAreaElement | null>(null);
const source = ref('');
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

// Load the current language example without putting large documents in locale messages.
watch(locale, (newLocale) => {
  void fetchExample(newLocale).then(replaceSource);
}, { immediate: true });

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
</style>
