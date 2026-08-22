<!-- @/components/Playground/MarkdownToolbar.vue -->
<template>
  <nav class="editor-toolbar">
    <button
      type="button"
      :disabled="!canUndo"
      title="Undo"
      @click="$emit('undo')"
    >
      ↶
    </button>
    <button
      type="button"
      :disabled="!canRedo"
      title="Redo"
      @click="$emit('redo')"
    >
      ↷
    </button>
    <span class="toolbar-divider" aria-hidden="true" />
    <button type="button" title="Format Document" @click="$emit('format')">
      ✨
    </button>
    <span class="toolbar-divider" aria-hidden="true" />
    <button type="button" title="Bold" @click="$emit('tool', 'bold')">
      <strong>B</strong>
    </button>
    <button type="button" title="Italic" @click="$emit('tool', 'italic')">
      <em>I</em>
    </button>
    <button type="button" title="Heading" @click="$emit('tool', 'heading')">
      H
    </button>
    <button
      type="button"
      title="Strikethrough"
      @click="$emit('tool', 'strike')"
    >
      <s>S</s>
    </button>
    <button
      type="button"
      title="Unordered list"
      @click="$emit('tool', 'unordered-list')"
    >
      ☷
    </button>
    <button
      type="button"
      title="Ordered list"
      @click="$emit('tool', 'ordered-list')"
    >
      №
    </button>
    <button type="button" title="Checklist" @click="$emit('tool', 'checklist')">
      ☑
    </button>
    <button type="button" title="Blockquote" @click="$emit('tool', 'quote')">
      ❯
    </button>
    <button type="button" title="Code" @click="$emit('tool', 'code')">
      &lt;/&gt;
    </button>
    <button type="button" title="Link" @click="$emit('tool', 'link')">↗</button>
    <button type="button" title="Table" @click="$emit('tool', 'table')">
      ▦
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { MarkdownTool } from '../../composables/useMarkdownEditor';

defineProps<{
  canUndo: boolean;
  canRedo: boolean;
}>();

defineEmits<{
  (event: 'undo'): void;
  (event: 'redo'): void;
  (event: 'format'): void;
  (event: 'tool', tool: MarkdownTool): void;
}>();
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px;
  overflow-x: auto;
  scrollbar-width: none;
}

.editor-toolbar button {
  display: grid;
  min-width: 30px;
  height: 30px;
  place-items: center;
  padding: 0 7px;
  border: 0;
  border-radius: 6px;
  color: #53606d;
  background: transparent;
  font:
    600 13px ui-monospace,
    monospace;
  cursor: pointer;
}

.editor-toolbar button:hover:not(:disabled) {
  color: #3855ae;
  background: #edf1ff;
}
.editor-toolbar button:disabled {
  color: #c7cdd3;
  cursor: not-allowed;
}
.toolbar-divider {
  width: 1px;
  height: 22px;
  margin: 0 5px;
  background: #dfe4e8;
}
</style>
