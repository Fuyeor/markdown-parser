<!-- @/components/Playground/PlaygroundShare.vue -->
<template>
  <button type="button" class="sidebar-share-btn" @click="openShareModal">
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
      <span>{{ t('playground.share.button') }}</span>
  </button>

  <Modal v-model="isShareModalOpen">
      <template #header>
        <h3>{{ t('playground.share') }}</h3>
      </template>
      <div class="share-modal-content">
        <p>{{ t('playground.share.desc') }}</p>
        <div class="share-input-group">
          <input
            type="text"
            readonly
            :value="shareLink"
            @focus="$event.target?.select()"
          />
          <button type="button" @click="copyShareLink">
            {{ t('copy') }}
          </button>
        </div>
      </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { Modal, useToast } from '@fuyeor/interactify';
import { encodeSnippet } from '@/composables/useCompression';
import { usePlaygroundSource } from '@/composables/usePlaygroundSource';

const { t } = useLocale();
const { showToast } = useToast();
const { source } = usePlaygroundSource();

const isShareModalOpen = ref(false);
const shareLink = ref('');

// Build a stable playground share URL so local document IDs are never exposed.
const openShareModal = async () => {
  const snippet = await encodeSnippet(source.value);
  const url = new window.URL('/playground', window.location.origin);
  url.hash = `snippet=${snippet}`;
  shareLink.value = url.toString();
  isShareModalOpen.value = true;
};

const copyShareLink = async () => {
  await window.navigator.clipboard.writeText(shareLink.value);
  showToast(t('copy.success'), { type: 'success' });
};
</script>

<style>
.sidebar-share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
  background: #ffffff;
  color: #3855ae;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.sidebar-share-btn:hover {
  background: #edf1ff;
}

.share-modal-content p {
  margin: 0 0 12px 0;
  color: #53606d;
}

.share-input-group {
  display: flex;
  gap: 8px;
}

.share-input-group input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
  background: #fbfcfd;
  color: #1a2027;
  font-family: ui-monospace, monospace;
}

.share-input-group button {
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: #3855ae;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.share-input-group button:hover {
  background: #2a418a;
}
</style>
