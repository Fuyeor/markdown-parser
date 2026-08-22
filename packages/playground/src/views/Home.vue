<!-- @fuyeor/markdown-parser-playground/src/Playground.vue -->
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
      <textarea v-model="source" spellcheck="false" />
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
import { computed, h, ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { LocaleSwitcher, Tabs, type TabItem } from '@fuyeor/interactify';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';
import { SUPPORTED_LOCALES } from '../config/locales';

const { t } = useLocale();
const route = useRoute();
const router = useRouter();
const source = ref(t('editor.sample'));
const activeTab = ref('preview');
const tabs: TabItem[] = [
  { value: 'preview' },
  { value: 'ast' },
  { value: 'html' },
];

const handleLocaleChange = (newLocale: string) => {
  router.replace({
    name: route.name,
    params: { locale: newLocale },
  });
};

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', renderToVue(ast.value)),
}));
</script>

<style>
.topbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin: 20px;
}
</style>
