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
        <a class="nav-item" href="#ast">{{ t('preview.ast') }}</a>
        <a class="nav-item" href="#html">{{ t('preview.html') }}</a>
      </nav>
  </aside>

  <main class="workspace">
    <header class="topbar">
      <div>
        <p class="eyebrow">{{ t('page.eyebrow') }}</p>
        <h1>{{ t('page.title') }}</h1>
      </div>
      <div class="topbar-actions">
        <label class="locale-picker">
          <span class="sr-only">Language</span>
          <select :value="locale.locale" @change="changeLocale">
            <option v-for="code in supportedLocales" :key="code" :value="code">{{ code }}</option>
          </select>
        </label>
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
        <header class="pane-header"><span>03</span><h2>{{ t('preview.ast') }}</h2></header>
        <pre>{{ astJson }}</pre>
      </article>
      <article id="html" class="pane code-pane html-pane">
        <header class="pane-header"><span>04</span><h2>{{ t('preview.html') }}</h2></header>
        <pre>{{ renderedHtml }}</pre>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { createFuyeorMarkdownParser, render as renderMarkdown } from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';

const { locale, t } = useLocale();
const supportedLocales = ['ar', 'de', 'en', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'zh-hans'];
const source = ref(t('editor.sample'));
function changeLocale(event: Event) {
  const element = event.currentTarget ?? event.target;
  const nextLocale = element instanceof HTMLSelectElement ? element.value : '';
  if (!supportedLocales.includes(nextLocale)) return;
  locale.locale.value = nextLocale;
}

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', { class: 'markdown-rendered' }, renderToVue(ast.value)),
}));
</script>
