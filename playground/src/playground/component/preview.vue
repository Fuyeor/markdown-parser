<!-- @/playground/component/preview.vue -->
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
import { computed, h, ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { Tabs, type TabItem } from '@fuyeor/interactify';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@ffm/parser';
import { renderToVue } from '@ffm/vue-renderer';
import { usePlaygroundSource } from '@/playground/composable/usePlaygroundSource';
import { useScrollSync } from '@/playground/composable/useScrollSync';

const emit = defineEmits<{
  (event: 'scroll', percentage: number): void;
}>();

const { t } = useLocale();
const { source } = usePlaygroundSource();
const { markScrollSource, isScrollFromOther } = useScrollSync();

const activeTab = ref('preview');
const outputContent = ref<HTMLElement | null>(null);

const tab: TabItem[] = [
  { value: 'preview' },
  { value: 'ast' },
  { value: 'html' },
];

const parser = createFuyeorMarkdownParser();
const ast = computed(() => parser(source.value));
const json = computed(() => JSON.stringify(ast.value, null, 2));
const html = computed(() => renderMarkdown(ast.value));

const activeView = computed(() => {
  switch (activeTab.value) {
    case 'ast':
      return () => h('pre', json.value);
    case 'html':
      return () => h('pre', html.value);
    default:
      return () =>
        h('div', { class: 'markdown-rendered' }, renderToVue(ast.value));
  }
});

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

.output-content {
  padding: 12px 12px;
  height: 100vh;
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
