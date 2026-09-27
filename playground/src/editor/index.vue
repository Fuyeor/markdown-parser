<!-- @/editor/index.vue -->
<template>
  <div class="editor">
    <div class="editor-status">
      <span>{{ selection.anchor.blockId }}:{{ selection.anchor.offset }}</span>
      <span>{{ selection.head.blockId }}:{{ selection.head.offset }}</span>
      <span>{{ blockArray.length }} blocks</span>
    </div>
    <div ref="container" class="editor-surface markdown-rendered" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useEditor } from '@ffm/vue-editor';

const sample = `# Heading
Paragraph with **bold** and \`code\`.

- list item one
- list item two

> quote text

\`\`\`js
const a = 1
\`\`\``;

const container = ref<HTMLElement | null>(null);
const { blockArray, selection } = useEditor(container, {
  text: sample,
});
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-status {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-muted, #6b7280);
  font-variant-numeric: tabular-nums;
}

.editor-surface {
  margin: 20px 40px;
}
</style>
