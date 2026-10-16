<!-- @/document/component/preview.vue -->
<template>
  <article class="section preview">
    <Tabs
      containerClass="preview-tab"
      :tabs="tab"
      :active-tab-value="activeTab"
      :is-router-nav="false"
      @tab-click="activeTab = $event"
    >
      <template #preview>{{ t('playground.preview.render') }}</template>
      <template #ast>AST</template>
      <template #html>HTML</template>
    </Tabs>
    <div class="output-content" ref="outputContent" @scroll="handleScroll">
      <component :is="activeView" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, h, nextTick, ref, watch } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { Tabs, type TabItem } from '@fuyeor/interactify';
import { getCdnLibraryUrl } from '@fuyeor/commons';
import { createMarkdownParser, render, type AsyncRenderer } from '@ffm/parser';
import {
  hydrate,
  createHighlight,
  createLatex,
  createMermaid,
  createSmiles,
  createAbc,
} from '@ffm/parser/plugin';
import { renderToVue } from '@ffm/vue-renderer';
import { usePlaygroundSource } from '@/document/composable/usePlaygroundSource';
import { useScrollSync } from '@/document/composable/useScrollSync';
import { formatHtml } from '@/document/util/formatter';

const emit = defineEmits<{
  (event: 'scroll', percentage: number): void;
}>();

const { t } = useLocale();
const { source } = usePlaygroundSource();
const { markScrollSource, isScrollFromOther } = useScrollSync();

const activeTab = ref('preview');
const renderVersion = ref(0);
const outputContent = ref<HTMLElement | null>(null);

const tab: TabItem[] = [
  { value: 'preview' },
  { value: 'ast' },
  { value: 'html' },
];

// 异步渲染器：CDN 地址由 playground 提供，parser 本身不携带任何 CDN 常量
const asyncRenderer: readonly AsyncRenderer[] = [
  createHighlight({
    script: getCdnLibraryUrl('highlight.js/11.11.1/es/core.min.js'),
    language: (lang) =>
      getCdnLibraryUrl(`highlight.js/11.11.1/languages/${lang}.min.js`),
    style: ['https://deliver.fuyeor.net/@fu/styles/highlight.min.css'],
  }),
  createLatex({
    script: getCdnLibraryUrl('KaTeX/0.16.9/katex.min.js'),
    style: [getCdnLibraryUrl('KaTeX/0.16.9/katex.min.css')],
  }),
  createMermaid({
    script: getCdnLibraryUrl('mermaid/10.9.0/mermaid.min.js'),
  }),
  createSmiles({
    endpoint: 'https://chemistry.fuyeor.net/v1/depict',
  }),
  createAbc({
    script: getCdnLibraryUrl('abcjs/6.5.2/abcjs-basic-min.js'),
  }),
];

// full preset：latex + twemoji + highlight + mermaid + abc + smiles
const parser = createMarkdownParser();
const ast = computed(() => parser(source.value));
const json = computed(() => JSON.stringify(ast.value, null, 2));
const html = computed(() => render(ast.value));

// 当输入内容改变、重新生成 AST 时，版本号 +1
watch(ast, () => {
  renderVersion.value++;
});

const activeView = computed(() => {
  switch (activeTab.value) {
    case 'ast':
      return () => h('pre', json.value);
    case 'html':
      return () => h('pre', formattedHtml.value);
    default:
      return () =>
        h(
          'div',
          {
            class: 'markdown-rendered',
            key: renderVersion.value,
          },
          renderToVue(ast.value),
        );
  }
});

const formattedHtml = computed(() => {
  if (activeTab.value !== 'html') return '';
  return formatHtml(html.value);
});

// ast 或 tab 变化后水合异步节点（KaTeX / Mermaid / ABC / SMILES / hljs）
watch(
  [ast, activeTab],
  () => {
    if (activeTab.value !== 'preview') return;
    nextTick(async () => {
      const root = outputContent.value;
      if (!root) return;
      // Vue diff 会更新 textContent，但不会清除 hydrate 打的 rendered 标志；
      // 保留旧标志会导致 hydrate 跳过已更新的节点，SVG 残留
      for (const element of root.querySelectorAll<HTMLElement>(
        '[data-ffm-rendered]',
      ))
        delete element.dataset.ffmRendered;
      await hydrate(root, asyncRenderer);
    });
  },
  { immediate: true },
);

let rafId = 0;

const handleScroll = (event: Event) => {
  if (isScrollFromOther('preview')) return;

  markScrollSource('preview');

  const target = event.target as HTMLElement;
  if (rafId) return;
  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    const maxScroll = target.scrollHeight - target.clientHeight;
    const percentage = maxScroll > 0 ? target.scrollTop / maxScroll : 0;
    emit('scroll', percentage);
  });
};

const scrollToPercentage = (percentage: number) => {
  if (isScrollFromOther('textarea')) return;

  markScrollSource('textarea');

  const target = outputContent.value;
  if (!target) return;
  const maxScroll = target.scrollHeight - target.clientHeight;
  if (maxScroll > 0) target.scrollTop = maxScroll * percentage;
};

defineExpose({ scrollToPercentage, html });
</script>

<style>
.preview-tab.tab-container {
  z-index: 9;
  margin: 0;
  display: flex;
  /* 不参与剩余高度分配 */
  flex: 0 0 auto;
  position: sticky;
  border: none;
  top: 0;

  :after {
    display: none;
  }

  span {
    background-color: var(--surface-raised);
    border-radius: 24px;
    flex: none;
    min-width: 80px;
    height: auto;
    margin: 10px;
    padding: 5px 16px;
    transition: background-color 0.3s;
  }

  span:hover {
    background-color: var(--surface-top-hover);
  }

  span.active {
    display: flex;
    gap: 8px;
    margin: 0;
    font-weight: 600;
  }

  span.active::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-brand);
    vertical-align: middle;
  }
}

/* 只在这一块滚动，高度由 flex 决定 */
.output-content {
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  padding: 12px 12px;
  overflow-y: auto;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

@media (width <= 768px) {
  .preview-tab.tab-container {
    top: var(--height-sticky-header);
    height: calc(var(--height-sticky-header) - 10px);
  }

  .output-content {
    padding: 6px 16px 48px 16px;
    height: stretch;
    scrollbar-width: none;
  }
}
</style>
