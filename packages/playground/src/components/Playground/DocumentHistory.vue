<!-- @/components/Playground/DocumentHistory.vue -->
<template>
  <!-- only shows when user created example doc -->
  <Foldable
    v-if="filteredDocuments.length !== 0"
    :title="t('documents')"
    :model-value="true"
    :icon-url="getIconUrl('learn')"
    class="document-history"
  >
    <div class="document-search-container">
      <input
        v-model="searchQuery"
        type="search"
        class="document-search-input"
        :placeholder="t('documents.search')"
        :aria-label="t('documents.search')"
      />

      <button
        type="button"
        class="clear-documents-button"
        :aria-label="t('documents.clear')"
        :title="t('documents.clear')"
        @click="isClearDocumentsModalOpen = true"
      >
        <img class="document-icon" :src="getIconUrl('close')" alt="" />
      </button>
    </div>

    <Modal v-model="isClearDocumentsModalOpen" size="small">
      <template #header>
        <h3>{{ t('documents.clear') }}</h3>
      </template>
      <div class="clear-documents-content">
        <p>{{ t('documents.clearConfirm') }}</p>
      </div>
      <template #footer>
        <div class="clear-documents-actions">
          <button
            type="button"
            class="clear-documents-cancel"
            @click="isClearDocumentsModalOpen = false"
          >
            {{ t('cancel') }}
          </button>
          <button
            type="button"
            class="clear-documents-confirm"
            @click="handleClearDocuments"
          >
            {{ t('confirm') }}
          </button>
        </div>
      </template>
    </Modal>

    <div class="document-list">
      <template v-for="document in filteredDocuments" :key="document.id">
        <router-link
          :to="{
            name: 'Playground',
            params: { ...route.params, id: document.id },
          }"
          class="document-item"
          :class="{ active: currentDocumentId === document.id }"
        >
          <span class="document-info">
            <span class="document-title">{{
              document.title || t('documents.untitled')
            }}</span>
            <span class="document-time">
              {{ formatTime(document.updated_at) }}
              <span
                v-if="document.word_count !== undefined"
                class="document-word-count"
              >
                {{
                  t('documents.stats.words', {
                    count: document.word_count,
                  })
                }}
              </span>
              <DropdownMenu
                :aria-label="`${t('delete')}: ${document.title}`"
                :items="documentMenuItems(document)"
              />
            </span>
          </span>
        </router-link>
      </template>
    </div>
  </Foldable>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { useLocale } from '@fuyeor/locale';
import { getIconUrl } from '@fuyeor/commons';
import {
  DropdownMenu,
  Foldable,
  Modal,
  type DropdownItem,
} from '@fuyeor/interactify';
import { useIndexedDb, type HistoryDocument } from '@/composables/useIndexedDb';

const route = useRoute();
const router = useRouter();
const { t, locale } = useLocale();
const { documents, deleteDocument, clearDocuments } = useIndexedDb();
const searchQuery = ref('');
const isClearDocumentsModalOpen = ref(false);

const currentDocumentId = computed(() => String(route.params.id ?? ''));

const documentMenuItems = (document: HistoryDocument): DropdownItem[] => [
  {
    label: t('delete'),
    action: () => handleDeleteDocument(document),
    class: 'text-danger',
  },
];

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  if (!query) return documents.value;

  return documents.value.filter(
    (document) =>
      document.title.toLocaleLowerCase().includes(query) ||
      document.content.toLocaleLowerCase().includes(query),
  );
});

// Delete the local document and clear the current route when needed.
const handleDeleteDocument = async (document: HistoryDocument) => {
  await deleteDocument(document.id);
  if (currentDocumentId.value !== document.id) return;

  router.replace({
    name: 'Playground',
    params: { ...route.params, id: undefined },
  });
};

// Clear all local documents and leave the active document route when necessary.
const handleClearDocuments = async () => {
  await clearDocuments();
  isClearDocumentsModalOpen.value = false;
  if (route.name !== 'Playground' || !currentDocumentId.value) return;

  await router.replace({
    name: 'Playground',
    params: { ...route.params, id: undefined },
  });
};

// Format relative timestamps in the active locale.
const formatTime = (timestamp: number): string => {
  const diff = Math.max(0, window.Date.now() - timestamp);
  if (diff < 60000) return t('documents.justNow');
  if (diff < 3600000)
    return t('documents.minutesAgo', {
      value: Math.floor(diff / 60000),
    });
  if (diff < 86400000)
    return t('documents.hoursAgo', {
      value: Math.floor(diff / 3600000),
    });
  if (diff < 172800000) return t('documents.yesterday');
  if (diff < 604800000)
    return t('documents.daysAgo', {
      value: Math.floor(diff / 86400000),
    });
  if (diff < 2592000000)
    return t('documents.weeksAgo', {
      value: Math.floor(diff / 604800000),
    });

  return new window.Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(timestamp);
};
</script>

<style>
.foldable-content {
  padding: 0 10px;
}

.document-history {
  margin: 10px;
}

.document-history-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.document-search-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0 20px;
}

.document-search-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 8px 12px;
  border: var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background: var(--surface-raised);
  font-size: 0.85rem;
  outline: none;
}

.document-search-input:focus {
  border: var(--input-border-focus);
}

.clear-documents-button {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
}

.clear-documents-button:hover,
.clear-documents-button:focus-visible {
  background: var(--surface-raised);
}

.clear-documents-button .document-icon {
  width: 18px;
  height: 18px;
  opacity: 0.65;
}

.clear-documents-button:hover .document-icon,
.clear-documents-button:focus-visible .document-icon {
  opacity: 1;
}

.clear-documents-content p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.clear-documents-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.clear-documents-actions button {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-weight: 600;
}

.clear-documents-cancel {
  border: var(--border-subtle);
  color: var(--text-secondary);
  background: var(--surface-raised);
}

.clear-documents-confirm {
  border: 1px solid var(--color-danger, #c84c4a);
  color: #ffffff;
  background: var(--color-danger, #c84c4a);
}

.clear-documents-confirm:hover {
  filter: brightness(0.92);
}

.document-list {
  display: flex;
  max-height: calc(100vh - 200px);
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.document-item {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  padding: 14px 20px;
  border: 0;
  border-radius: var(--radius-lg);
  color: inherit;
  background: transparent;
  font-weight: unset;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.18s ease-out;
}

.document-item:hover,
.document-item:focus-visible,
.document-item.active {
  background-color: var(--surface-raised);
}

.document-item.active .document-icon {
  color: #6b46c1;
  opacity: 1;
}

.document-info {
  display: flex;
  flex: 1;
  gap: 6px;
  flex-direction: column;
  min-width: 0;
}

.document-title,
.document-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-title {
  color: var(--text-primary);
  font-size: 0.9rem;
}

.document-item.active {
  .document-title {
    font-weight: 500;
  }
}

.document-time {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.document-word-count {
  margin-left: 2px;
}

.document-item-wrapper:hover .document-menu,
.document-item-wrapper:focus-within .document-menu {
  opacity: 1;
}
</style>
