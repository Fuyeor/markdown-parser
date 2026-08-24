<!-- @/components/Playground/PlaygroundEditor.vue -->
<template>
  <article class="section editor">
    <MarkdownToolbar
      :can-undo="canUndo"
      :can-redo="canRedo"
      @undo="undo"
      @redo="redo"
      @format="formatDocument"
      @tool="applyTool"
      @copy-source="emit('copy-source')"
      @copy-html="emit('copy-html')"
    >
      <template #share>
        <slot name="share" />
      </template>
    </MarkdownToolbar>
    <div
      class="editor-scroll-container"
      @scroll="syncScroll"
      ref="scrollContainer"
    >
      <div class="editor-line-numbers" aria-hidden="true">
        <div v-for="n in lineNumbers" :key="n" class="line-number">{{ n }}</div>
      </div>
      <div
        class="editor-content-wrapper"
        :style="{ minHeight: `calc(${lineNumbers.length} * 1.6em + 32px)` }"
      >
        <div
          v-if="!supportsCustomHighlight"
          class="editor-highlight-layer"
          aria-hidden="true"
        >
          <div
            v-for="(html, i) in highlightedLines"
            :key="i"
            class="highlight-line"
            v-html="html"
          ></div>
        </div>
        <div
          v-else
          ref="highlightTarget"
          class="editor-highlight-layer custom-highlight-target"
          aria-hidden="true"
        >
          {{ source + (source.endsWith('\n') ? ' ' : '') }}
        </div>
        <textarea
          ref="editor"
          v-model="source"
          spellcheck="false"
          class="editor-textarea"
          @input="recordInput"
          @scroll="syncTextareaScroll"
        />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import MarkdownToolbar from '@/components/Playground/MarkdownToolbar.vue';

import { ref } from 'vue';
import { useMarkdownEditor } from '@/composables/useMarkdownEditor';
import { usePlaygroundSource } from '@/composables/usePlaygroundSource';
import { useMarkdownHighlighter } from '@/composables/useMarkdownHighlighter';
import { useDocumentStats } from '@/composables/useDocumentStats';

const props = withDefaults(
  defineProps<{
    createdAt?: number;
    updatedAt?: number;
  }>(),
  {
    createdAt: 0,
    updatedAt: 0,
  },
);

const { source } = usePlaygroundSource();

const editor = ref<HTMLTextAreaElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const highlightTarget = ref<HTMLElement | null>(null);
const supportsCustomHighlight = 'highlights' in window.CSS;

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

const { lineNumbers, highlightedLines } = useMarkdownHighlighter(
  source,
  highlightTarget,
  supportsCustomHighlight,
);
const { stats } = useDocumentStats(source);

// The outer container owns scrolling so line numbers and the mirrored text stay aligned.
const emit = defineEmits<{
  (e: 'scroll', percentage: number): void;
  (e: 'copy-source'): void;
  (e: 'copy-html'): void;
}>();

// The outer container owns scrolling so line numbers and the mirrored text stay aligned.
const syncScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const maxScroll = target.scrollHeight - target.clientHeight;
  const percentage = maxScroll > 0 ? target.scrollTop / maxScroll : 0;
  emit('scroll', percentage);
};

const syncTextareaScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (scrollContainer.value) scrollContainer.value.scrollTop = target.scrollTop;
};

const scrollToPercentage = (percentage: number) => {
  const target = scrollContainer.value;
  if (!target) return;
  const maxScroll = target.scrollHeight - target.clientHeight;
  if (maxScroll > 0) target.scrollTop = maxScroll * percentage;
};

defineExpose({ editor, replaceSource, stats, scrollToPercentage });
</script>

<style>
.editor,
.preview {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 0;
  flex-direction: column;
}

.tab-container {
  height: 3rem;
  border-bottom: var(--border-subtle);
}

.editor-scroll-container {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 1rem;
  line-height: 1.6;
}

.editor-line-numbers {
  padding: 16px 12px;
  text-align: right;
  color: #a0aec0;
  user-select: none;
  border-right: var(--border-default);
  background: var(--surface-top);
}

.line-number {
  min-height: 1.6em;
}

.editor-content-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.editor-highlight-layer,
.editor-textarea {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 16px;
  margin: 0;
  border: 0;
  box-sizing: border-box;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.editor-highlight-layer {
  pointer-events: none;
  z-index: 1;
  color: #1a202c;
}

.highlight-line {
  min-height: 1.6em;
}

.editor-textarea {
  color: transparent;
  background: transparent;
  caret-color: #2b6cb0;
  resize: none;
  outline: none;
  overflow: hidden;
  z-index: 2;
}

/* Make selection visible on the transparent textarea */
.editor-textarea::selection {
  background: rgba(43, 108, 176, 0.25);
  color: transparent;
}

/* Fallback Highlighting tokens */
.hl-punctuation {
  color: #a0aec0;
}
.hl-heading {
  color: #553c9a;
  font-weight: 600;
}
.hl-quote {
  color: #718096;
  font-style: italic;
}
.hl-list {
  color: #2d3748;
}
.hl-bold {
  font-weight: 700;
  color: #1a202c;
}
.hl-italic {
  font-style: italic;
  color: #1a202c;
}
.hl-code {
  color: #d53f8c;
  background: #faf5ff;
  border-radius: 3px;
  padding: 0 2px;
}
.hl-strike {
  text-decoration: line-through;
  color: #a0aec0;
}
.hl-code-fence {
  color: #805ad5;
}
</style>
