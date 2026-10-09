<!-- @/playground/component/MarkdownToolbar.vue -->
<template>
  <nav class="editor-toolbar">
    <!-- history / share / copy -->
    <div class="toolbar-row">
      <template v-for="(group, index) in documentTool" :key="index">
        <button
          v-for="item in group"
          v-tooltip="{ text: item.tooltip, placement: 'bottom' }"
          type="button"
          :key="item.tooltip"
          :class="{ 'is-active': item.isActive?.() }"
          :disabled="item.isDisabled?.()"
          @click="item.action()"
        >
          <img
            alt=""
            :src="item.icon"
            :class="{ monochrome: !item.isColorful }"
          />
        </button>

        <span
          v-if="index < documentTool.length - 1"
          class="toolbar-divider"
          aria-hidden="true"
        />
      </template>
    </div>

    <!-- format tool -->
    <div class="toolbar-row">
      <button
        v-for="item in formatTool"
        v-tooltip="{ text: item.tooltip, placement: 'bottom' }"
        type="button"
        :key="item.tooltip"
        :class="{ 'is-active': item.isActive?.() }"
        :disabled="item.isDisabled?.()"
        @click="item.action()"
      >
        <img
          alt=""
          :src="item.icon"
          :class="{ monochrome: !item.isColorful }"
        />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { getIconUrl, getTwemojiUrl } from '@fuyeor/commons';
import type { MarkdownTool } from '@/playground/composable/useMarkdownEditor';

const props = defineProps<{
  canUndo: boolean;
  canRedo: boolean;
  hasContent?: boolean;
}>();

const emit = defineEmits<{
  (event: 'undo'): void;
  (event: 'redo'): void;
  (event: 'clean'): void;
  (event: 'format'): void;
  (event: 'option'): void;
  (event: 'share'): void;
  (event: 'copy-source'): void;
  (event: 'copy-html'): void;
  (event: 'tool', tool: MarkdownTool): void;
}>();

const { t } = useLocale();

interface ToolbarItem {
  tooltip: string;
  icon: string;
  isColorful?: boolean;
  isActive?: () => boolean;
  isDisabled?: () => boolean;
  action: () => void;
}

const documentTool = computed<ToolbarItem[][]>(() => [
  [
    {
      icon: getIconUrl('undo'),
      tooltip: t('undo'),
      isDisabled: () => !props.canUndo,
      action: () => emit('undo'),
    },
    {
      icon: getIconUrl('redo'),
      tooltip: t('redo'),
      isDisabled: () => !props.canRedo,
      action: () => emit('redo'),
    },
    {
      icon: getIconUrl('close'),
      tooltip: t('editor.clean'),
      action: () => emit('clean'),
    },
  ],
  [
    {
      icon: getTwemojiUrl('2728'),
      isColorful: true,
      tooltip: t('editor.format'),
      action: () => emit('format'),
    },
    {
      icon: getIconUrl('settings'),
      tooltip: t('editor.option'),
      action: () => emit('option'),
    },
  ],
  [
    {
      icon: getIconUrl('follow'),
      tooltip: t('playground.share.button'),
      action: () => emit('share'),
    },
    {
      icon: getTwemojiUrl('1f4c4'),
      isColorful: true,
      tooltip: t('editor.copy.source'),
      action: () => emit('copy-source'),
    },
    {
      icon: getTwemojiUrl('1f4d1'),
      isColorful: true,
      tooltip: t('editor.copy.richText'),
      action: () => emit('copy-html'),
    },
  ],
]);

const formatTool = computed<ToolbarItem[]>(() => [
  {
    icon: getIconUrl('bold'),
    tooltip: t('editor.bold'),
    action: () => emit('tool', 'bold'),
  },
  {
    icon: getIconUrl('italic'),
    tooltip: t('editor.italic'),
    action: () => emit('tool', 'italic'),
  },
  {
    icon: getIconUrl('h1'),
    tooltip: t('editor.heading'),
    action: () => emit('tool', 'heading'),
  },
  {
    icon: getIconUrl('list'),
    tooltip: t('editor.list.bullet'),
    action: () => emit('tool', 'unordered-list'),
  },
  {
    icon: getIconUrl('quote'),
    tooltip: t('editor.quote'),
    action: () => emit('tool', 'quote'),
  },
  {
    icon: getIconUrl('code'),
    tooltip: t('editor.codeBlock'),
    action: () => emit('tool', 'code'),
  },
  {
    icon: getIconUrl('link'),
    tooltip: t('editor.link'),
    action: () => emit('tool', 'link'),
  },
]);
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.editor-toolbar button {
  display: grid;
  min-width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 24px;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.3s ease;

  img {
    width: 20px;
    height: 20px;
  }

  img.monochrome {
    filter: brightness(1.6);
  }

  &.is-active {
    background-color: var(--surface-top-hover);
  }

  &:hover:not(:disabled) {
    background-color: var(--surface-top-hover);

    img.monochrome {
      filter: brightness(0) invert(50%) sepia() saturate(200%) hue-rotate(80deg);
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.toolbar-divider {
  height: 22px;
  margin: 0 5px;
  border-left: var(--border-default);
}

@media (width <= 900px) {
  .editor-toolbar button {
    min-width: 34px;
    height: 34px;
  }
}
</style>
