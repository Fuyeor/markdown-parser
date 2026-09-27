<!-- @/playground/component/editor.vue -->
<template>
  <article class="section textarea">
    <toolbar
      :can-undo="canUndo"
      :can-redo="canRedo"
      @undo="undo"
      @redo="redo"
      @clean="handleClean"
      @format="formatDocument"
      @tool="applyTool"
      @share="emit('share')"
      @copy-source="emit('copy-source')"
      @copy-html="emit('copy-html')"
    />

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

    <stats-bar
      v-if="stats"
      :created-at="createdAt"
      :updated-at="updatedAt"
      :stats="stats"
    />
  </article>
</template>

<script setup lang="ts">
import Toolbar from './toolbar.vue';
import StatsBar from './stats-bar.vue';

import { ref } from 'vue';
import { useMarkdownEditor } from '@/playground/composable/useMarkdownEditor';
import { usePlaygroundSource } from '@/playground/composable/usePlaygroundSource';
import { useScrollSync } from '@/playground/composable/useScrollSync';
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
const { markScrollSource, isScrollFromOther } = useScrollSync();

const editor = ref<HTMLTextAreaElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const highlightTarget = ref<HTMLElement | null>(null);

const {
  canUndo,
  canRedo,
  undo,
  redo,
  clearSource,
  replaceSource,
  recordInput,
  applyTool,
  formatDocument,
} = useMarkdownEditor(source, editor);

const { lines } = useMarkdownHighlighter(source, highlightTarget);
const { stats } = useDocumentStats(source);

// The outer container owns scrolling so line numbers and the mirrored text stay aligned.
const emit = defineEmits<{
  (e: 'scroll', percentage: number): void;
  (e: 'clean'): void;
  (e: 'share'): void;
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

const handleClean = () => {
  if (!source.value) return;
  clearSource();
  emit('clean');
};

let rafId = 0;

// 用户滚动 editor → 通知对面
const syncScroll = (event: Event) => {
  // 这次是 preview 的程序设置引发的 scroll 事件，忽略
  if (isScrollFromOther('editor')) return;

  markScrollSource('editor');

  const target = event.target as HTMLElement;
  if (rafId) return;
  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    const maxScroll = target.scrollHeight - target.clientHeight;
    const percentage = maxScroll > 0 ? target.scrollTop / maxScroll : 0;
    emit('scroll', percentage);
  });
};

// 对面要求 editor 跳到某位置
const scrollToPercentage = (percentage: number) => {
  // 用户此刻正在滚 editor，别再跟对面较劲
  if (isScrollFromOther('preview')) return;

  markScrollSource('preview'); // 告诉 syncScroll：下一次是我自己触发的

  const target = scrollContainer.value;
  if (!target) return;
  const maxScroll = target.scrollHeight - target.clientHeight;
  if (maxScroll > 0) target.scrollTop = maxScroll * percentage;
};

defineExpose({ editor, replaceSource, stats, scrollToPercentage });
</script>

<style>
.textarea {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 0;
  flex-direction: column;
  background: var(--surface-top);

  textarea:hover,
  textarea:focus {
    box-shadow: none;
  }
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

@media (width <= 900px) {
  .textarea {
    --surface-top: #20253a;

    z-index: 10;
    background: var(--surface-top);
    padding: 0 !important;
    border-radius: 26px 26px 0 0;
    box-shadow:
      0 1px 3px 0 rgba(0, 0, 0, 0.2),
      0 0 1px 0 rgba(0, 0, 0, 0.08),
      0px 0.5px 0.5px 0.5px hsla(0, 0%, 100%, 0.05) inset;
  }

  .editor-scroll-container {
    scrollbar-width: none;
  }

  .line-number {
    font-size: 0.8rem;
    padding: 0 6px;
  }
}
</style>
