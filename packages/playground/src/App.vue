<!-- @fuyeor/markdown-parser-playground/src/App.vue -->
<template>
  <aside class="sidebar">
      <div class="sidebar-content">
        <div class="brand-mark">M</div>
        <div>
          <strong>Markdown Parser</strong>
          <span>Playground</span>
        </div>
      </div>
      <nav class="sidebar-nav" aria-label="Playground navigation">
        <a class="nav-item active" href="#editor">Editor</a>
        <a class="nav-item" href="#preview">Preview</a>
        <a class="nav-item" href="#ast">JSON (AST)</a>
        <a class="nav-item" href="#html">HTML</a>
      </nav>
  </aside>

  <main class="workspace">
    <header class="topbar">
      <div>
        <p class="eyebrow">Interactive parser</p>
        <h1>Markdown Playground</h1>
      </div>
      <span class="status"><i />Live parsing</span>
    </header>
    <section class="panes" aria-label="Markdown parser output">
      <article id="editor" class="pane editor-pane">
        <header class="pane-header"><span>01</span><h2>Markdown</h2></header>
        <textarea v-model="source" aria-label="Markdown source" spellcheck="false" />
      </article>
      <article id="preview" class="pane preview-pane">
        <header class="pane-header"><span>02</span><h2>Preview</h2></header>
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
import { createFuyeorMarkdownParser, render as renderMarkdown } from '@fuyeor/markdown-parser';
import { renderToVue } from '@fuyeor/markdown-parser-vue';

const source = ref(`# Welcome to Markdown Playground

Edit the **Markdown** on the left and inspect the live outputs.

- Preview rendered from the Vue adapter
- JSON exposes the abstract syntax tree
- HTML shows the serialized output`);
const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const astJson = computed(() => JSON.stringify(ast.value, null, 2));
const renderedHtml = computed(() => renderMarkdown(ast.value));
const previewComponent = computed(() => ({
  render: () => h('div', { class: 'markdown-rendered' }, renderToVue(ast.value)),
}));
</script>
