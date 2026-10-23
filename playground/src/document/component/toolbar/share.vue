<!-- @/document/component/toolbar/share.vue -->
<template>
  <modal v-model="isShareModalOpen">
    <template #header>
      <h3>{{ t('playground.share') }}</h3>
    </template>
    <div class="share-modal-content">
      <copy-clipboard :value="shareLink" />

      <div class="social-share">
        <button
          v-ripple
          type="button"
          class="share-button"
          :disabled="!source"
          @click="copySource"
        >
          <img alt="" class="share-icon" :src="sourceIcon" />
          <span class="share-name">{{ t('editor.copy.source') }}</span>
        </button>

        <button
          v-ripple
          type="button"
          class="share-button"
          :disabled="!source"
          @click="copyHtml"
        >
          <img alt="" class="share-icon" :src="htmlIcon" />
          <span class="share-name">{{ t('editor.copy.richText') }}</span>
        </button>

        <button
          v-ripple
          type="button"
          class="share-button"
          :disabled="!shareId"
          @click="copyInternalLink"
        >
          <img alt="" class="share-icon" :src="linkIcon" />
          <span class="share-name">{{ t('editor.copy.link.internal') }}</span>
        </button>
      </div>
    </div>
  </modal>
</template>

<script setup lang="ts">
import CopyClipboard from './clipboard.vue';

import { ref } from 'vue';
import { t } from '@fuyeor/vue-locale';
import { Modal, toast, copyText } from '@fuyeor/interactify';
import { getTwemojiUrl } from '@fuyeor/commons';
import { source } from '@/document/state/source';
import { encodeSnippet } from '@/document/util/compression';
import { extractTitle } from '@/document/util/extractTitle';

const isShareModalOpen = ref(false);
const shareLink = ref('');
const shareHtml = ref('');
const shareId = ref('');

const sourceIcon = getTwemojiUrl('1f4c4');
const htmlIcon = getTwemojiUrl('1f4dd');
const linkIcon = getTwemojiUrl('1f517');

// 接收 preview 的 html 快照 + 当前文档 id
const open = async (html?: string, id?: string) => {
  shareHtml.value = html ?? '';
  shareId.value = id ?? '';
  const snippet = await encodeSnippet(source.value);
  const url = new window.URL('/document', window.location.origin);
  url.hash = `snippet=${snippet}`;
  shareLink.value = url.toString();
  isShareModalOpen.value = true;
};

const copySource = () => copyText(source.value);

const copyHtml = async () => {
  const html = shareHtml.value;
  if (!html) return;

  const clipboardItem = new window.ClipboardItem({
    'text/html': new window.Blob([html], { type: 'text/html' }),
    'text/plain': new window.Blob([source.value], { type: 'text/plain' }),
  });
  await window.navigator.clipboard.write([clipboardItem]);
  toast.show(t('copy.success'), { type: 'success' });
};

// copy Markdown internal link [title](./id)
const copyInternalLink = () => {
  if (!shareId.value) return;
  const title = extractTitle(source.value, t('document.untitled'));
  copyText(`[${title}](./${shareId.value})`);
};

defineExpose({ open });
</script>

<style>
.social-share {
  display: flex;
  gap: 6px;
  margin: 10px -6px 0;
  padding-top: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.share-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  width: 8rem;
  color: var(--text-secondary);
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  cursor: pointer;
  transition:
    transform 0.3s ease,
    background 0.3s ease;
}

.share-button:hover {
  transform: translateY(-2px);
  background: var(--surface-raised-hover);
}

.share-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.share-button:disabled:hover {
  transform: none;
  background: var(--surface-raised);
}

.share-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
}

.share-name {
  font-size: 14px;
  white-space: nowrap;
}

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
