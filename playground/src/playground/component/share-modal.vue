<!-- @/playground/component/share-modal.vue -->
<template>
  <modal v-model="isShareModalOpen">
    <template #header>
      <h3>{{ t('playground.share') }}</h3>
    </template>
    <div class="share-modal-content">
      <copy-clipboard :value="shareLink" />
    </div>
  </modal>
</template>

<script setup lang="ts">
import CopyClipboard from './copy-clipboard.vue';

import { ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { Modal } from '@fuyeor/interactify';
import { encodeSnippet } from '@/playground/composable/useCompression';
import { usePlaygroundSource } from '@/playground/composable/usePlaygroundSource';

const { t } = useLocale();
const { source } = usePlaygroundSource();

const isShareModalOpen = ref(false);
const shareLink = ref('');

// Build a stable playground share URL so local document IDs are never exposed.
const open = async () => {
  const snippet = await encodeSnippet(source.value);
  const url = new window.URL('/playground', window.location.origin);
  url.hash = `snippet=${snippet}`;
  shareLink.value = url.toString();
  isShareModalOpen.value = true;
};

defineExpose({ open });
</script>

<style>
.toolbar-share-btn {
  display: flex;
  min-width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  gap: 4px;
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
</style>
