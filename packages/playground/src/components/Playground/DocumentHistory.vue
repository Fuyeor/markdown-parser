<!-- @/components/Playground/DocumentHistory.vue -->
<template>
  <Foldable
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
    </div>

    <div class="document-list">
      <div
        v-for="document in filteredDocuments"
        :key="document.id"
        class="document-item-wrapper"
      >
        <router-link
          :to="{
            name: 'Playground',
            params: { ...route.params, id: document.id },
          }"
          class="document-item"
          :class="{ active: currentDocumentId === document.id }"
        >
          <img
            class="document-icon"
            aria-hidden="true"
            :src="getIconUrl('bookmark')"
          />
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
                ·
                {{
                  t('documents.stats.words', {
                    count: document.word_count,
                  })
                }}
              </span>
            </span>
          </span>
        </router-link>
        <button
          type="button"
          class="document-delete-button"
          :aria-label="`${t('documents.delete')}: ${document.title}`"
          @click.prevent.stop="handleDeleteDocument(document)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p v-if="filteredDocuments.length === 0" class="no-documents">
        {{ t('documents.empty') }}
      </p>
    </div>
  </Foldable>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { useLocale } from '@fuyeor/locale';
import { getIconUrl } from '@fuyeor/commons';
import { Foldable } from '@fuyeor/interactify';
import { useIndexedDb, type HistoryDocument } from '@/composables/useIndexedDb';

const route = useRoute();
const router = useRouter();
const { t, locale } = useLocale();
const { documents, deleteDocument } = useIndexedDb();
const searchQuery = ref('');

const currentDocumentId = computed(() => String(route.params.id ?? ''));

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

  void router.replace({
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
  position: relative;
  padding: 10px 0 20px;
}

.document-search-input {
  box-sizing: border-box;
  width: 100%;
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

.document-list {
  display: flex;
  max-height: calc(100vh - 200px);
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.document-item-wrapper {
  position: relative;
  display: flex;
  align-items: stretch;
}

.document-item {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  padding: 10px 32px 10px 12px;
  border: 0;
  border-radius: var(--radius-lg);
  color: inherit;
  background: transparent;
  font: inherit;
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

.document-icon {
  flex: 0 0 13px;
  height: 20px;
}

.document-item.active .document-icon {
  color: #6b46c1;
  opacity: 1;
}

.document-info {
  display: flex;
  flex: 1;
  gap: 8px;
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

.document-item.active .document-title {
  font-weight: 500;
}

.document-time {
  color: var(--text-secondary);
  font-size: 12px;
}

.document-word-count {
  margin-left: 2px;
}

.document-delete-button {
  position: absolute;
  top: 50%;
  right: 8px;
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--text-secondary, #8a94a6);
  background: transparent;
  font-size: 18px;
  line-height: 1;
  opacity: 0;
  transform: translateY(-50%);
  cursor: pointer;
  transition:
    opacity 0.16s ease-out,
    background-color 0.16s ease-out;
}

.document-item-wrapper:hover .document-delete-button,
.document-item-wrapper:focus-within .document-delete-button {
  opacity: 1;
}

.document-delete-button:hover,
.document-delete-button:focus-visible {
  color: #c53030;
  background: #fff5f5;
}

.no-documents {
  margin: 0;
  padding: 20px;
  color: var(--text-secondary, #a0aec0);
  font-size: 13px;
  text-align: center;
}
</style>
