<!-- @fuyeor/markdown-parser-playground/src/Playground.vue -->
<template>
  <section class="playground-page">
    <header class="topbar">
      <div>
        <p class="eyebrow">{{ t('page.eyebrow') }}</p>
        <h1>{{ t('page.title') }}</h1>
      </div>
      <div class="topbar-actions">
        <LocaleSwitcher :supported-locales="SUPPORTED_LOCALES" @change="handleLocaleChange" />
        <span class="status"><i />{{ t('page.liveParsing') }}</span>
      </div>
    </header>

    <section class="editor-output-layout" aria-label="Markdown parser playground">
      <article class="pane editor-pane">
        <header class="pane-header"><span>01</span><h2>{{ t('editor.formatter') }}</h2></header>
        <textarea v-model="source" :aria-label="t('editor.sourceLabel')" spellcheck="false" />
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
  </section>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRouter } from '@fuyeor/vue-router';
import { LocaleSwitcher, Tabs, type TabItem } from '@fuyeor/interactify';
import { createFuyeorMarkdownParser, render as renderMarkdown } from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';
import { SUPPORTED_LOCALES } from './config/locales';

const { t } = useLocale();
const router = useRouter();
const source = ref(t('editor.sample'));
const activeTab = ref('preview');
const tabs: TabItem[] = [
  { value: 'preview' },
  { value: 'ast' },
  { value: 'html' },
];

function handleLocaleChange(nextLocale: string) {
  if (!SUPPORTED_LOCALES.includes(nextLocale as (typeof SUPPORTED_LOCALES)[number])) return;
  router.replace({ name: 'playground', params: { locale: nextLocale } });
}

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', renderToVue(ast.value)),
}));
</script>
