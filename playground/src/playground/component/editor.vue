<!-- @/playground/component/editor.vue -->
<template>
  <article class="section editor">
    <toolbar
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
    </toolbar>

    <div
      class="editor-scroll-container"
      ref="scrollContainer"
      @scroll="syncScroll"
    >
      <div class="editor-grid" ref="highlightTarget">
        <div class="editor-gutter-bg" aria-hidden="true" />
        <template v-for="(line, i) in lines" :key="i">
          <div
            aria-hidden="true"
            class="line-number"
            :style="{ gridRow: `${i + 1}` }"
          >
            {{ i + 1 }}
          </div>
          <div
            aria-hidden="true"
            class="highlight-line custom-highlight-target"
            v-text="line || ' '"
            :style="{ gridRow: `${i + 1}` }"
          ></div>
        </template>

        <textarea
          ref="editor"
          spellcheck="false"
          class="editor-textarea"
          :value="source"
          @input="handleInput"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
        />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import Toolbar from './toolbar.vue';

import { ref } from 'vue';
import { useMarkdownEditor } from '@/playground/composable/useMarkdownEditor';
import { usePlaygroundSource } from '@/playground/composable/usePlaygroundSource';
import { useMarkdownHighlighter } from '@/playground/composable/useMarkdownHighlighter';
import { useDocumentStats } from '@/playground/composable/useDocumentStats';

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

const { lines } = useMarkdownHighlighter(source, highlightTarget);
const { stats } = useDocumentStats(source);

// The outer container owns scrolling so line numbers and the mirrored text stay aligned.
const emit = defineEmits<{
  (e: 'scroll', percentage: number): void;
  (e: 'copy-source'): void;
  (e: 'copy-html'): void;
}>();

// 输入法组合状态锁
const isComposing = ref(false);

const handleCompositionStart = () => {
  isComposing.value = true;
};

const handleCompositionEnd = (event: Event) => {
  isComposing.value = false;
  source.value = (event.target as HTMLTextAreaElement).value;
  // 选词完成时，立即将最终确定的中文写入撤销栈
  recordInput();
};

const handleInput = (event: Event) => {
  source.value = (event.target as HTMLTextAreaElement).value;
  // 拼音组合中只更新显示，绝不污染撤销历史栈
  if (!isComposing.value) {
    recordInput();
  }
};

// The outer container owns scrolling so line numbers and the mirrored text stay aligned.
const syncScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const maxScroll = target.scrollHeight - target.clientHeight;
  const percentage = maxScroll > 0 ? target.scrollTop / maxScroll : 0;
  emit('scroll', percentage);
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

.editor {
  border-right: var(--border-subtle);

  textarea:hover,
  textarea:focus {
    box-shadow: none;
  }
}

.tab-container {
  height: 3rem;
  border-bottom: var(--border-subtle);
}

.editor-scroll-container {
  min-height: 0;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  font-size: 1rem;
  line-height: 1.6;
}

.editor-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  /* 强制所有行靠顶紧凑排列，剩余空间留在底部 */
  align-content: start;
  min-height: 100%;
  padding: 16px 0;
  box-sizing: border-box;
  position: relative;
}

/* Line number background */
.editor-gutter-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  grid-column: 1;
  background: var(--surface-top);
  border-right: var(--border-default);
  pointer-events: none;
  z-index: 1;
}

.line-number {
  grid-column: 1;
  padding: 0 12px;
  text-align: right;
  color: #a0aec0;
  user-select: none;
  align-self: start;
  line-height: inherit;
  z-index: 2;
}

/* Rendering layer
 * Adapts to the height of the current line
 * and expands the line size naturally when encountering line breaks
 */
.highlight-line {
  grid-column: 2;
  padding: 0 16px;
  margin: 0;
  box-sizing: border-box;
  word-spacing: inherit;
  tab-size: 4;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  pointer-events: none;
  z-index: 2;
  min-height: 1.6em;
}

.editor-textarea {
  position: absolute;
  grid-column: 2;
  top: 16px;
  left: 0;
  width: 100%;
  height: calc(100% - 32px);
  padding: 0 16px;
  margin: 0;
  border: 0;
  box-sizing: border-box;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  word-spacing: inherit;
  tab-size: 4;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  color: transparent;
  background: transparent;
  caret-color: #2b6cb0;
  resize: none;
  outline: none;
  overflow: hidden;
  z-index: 3;
}

/* Make selection visible on the transparent textarea */
.editor-textarea::selection {
  background: rgba(43, 108, 176, 0.25);
  color: transparent;
}
</style>
