<!-- @fuyeor/markdown-parser-playground/src/App.vue -->
<template>
  <aside class="sidebar">
      <div class="sidebar-content">
        <div class="brand-mark">M</div>
        <div>
          <strong>{{ t('brand.name') }}</strong>
          <span>{{ t('brand.playground') }}</span>
        </div>
      </div>
      <nav class="sidebar-nav" aria-label="Playground navigation">
        <a class="nav-item active" href="#editor">{{ t('nav.editor') }}</a>
        <a class="nav-item" href="#preview">{{ t('preview.render') }}</a>
        <a class="nav-item" href="#ast">JSON (AST)</a>
        <a class="nav-item" href="#html">HTML</a>
      </nav>
  </aside>

  <main class="workspace">
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
    <section class="panes" aria-label="Markdown parser output">
      <article id="editor" class="pane editor-pane">
        <header class="pane-header"><span>01</span><h2>{{ t('editor.formatter') }}</h2></header>
        <textarea v-model="source" :aria-label="t('editor.sourceLabel')" spellcheck="false" />
      </article>
      <article id="preview" class="pane preview-pane">
        <header class="pane-header"><span>02</span><h2>{{ t('preview.render') }}</h2></header>
        <component :is="previewComponent" />
      </article>
      <article id="ast" class="pane code-pane">
        <header class="pane-header"><span>03</span><h2>JSON (AST)</h2></header>
        <pre>{{ astJson }}</pre>
      </article>
      <article id="html" class="pane code-pane html-pane">
        <header class="pane-header"><span>04</span><h2>HTML</h2></header>
        <pre>{{ renderedHtml }}</pre>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { LocaleSwitcher } from '@fuyeor/interactify';
import { useRouter } from '@fuyeor/vue-router';
import { SUPPORTED_LOCALES } from './locale';
import { createFuyeorMarkdownParser, render as renderMarkdown } from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';

const { t } = useLocale();
const router = useRouter();
const source = ref(t('editor.sample'));
function handleLocaleChange(nextLocale: string) {
  if (!SUPPORTED_LOCALES.includes(nextLocale as (typeof SUPPORTED_LOCALES)[number])) return;
  router.replace({ name: 'playground', params: { locale: nextLocale } });
}

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', { class: 'markdown-rendered' }, renderToVue(ast.value)),
}));
</script>
