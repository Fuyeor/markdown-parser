<!-- @/components/Playground/DocumentHistory.vue -->
<template>
  <Foldable
    :title="t('playground.documents')"
    :model-value="true"
    :icon-url="getIconUrl('learn')"
    class="document-history"
  >
    <div class="document-search-container">
      <input
        v-model="searchQuery"
        type="search"
        class="document-search-input"
        :placeholder="t('playground.documents.search')"
        :aria-label="t('playground.documents.search')"
      />
    </div>

    <div class="document-list">
      <div
        v-for="document in filteredDocuments"
        :key="document.id"
        class="document-item-wrapper"
      >
        <router-link
          :to="`${route.params.locale ? `/${route.params.locale}` : ''}/playground/${document.id}`"
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
              document.title || t('playground.documents.untitled')
            }}</span>
            <span class="document-time">{{
              formatTime(document.updated_at)
            }}</span>
          </span>
        </router-link>
        <button
          type="button"
          class="document-delete-button"
          :aria-label="`${t('playground.documents.delete')}: ${document.title}`"
          @click.prevent.stop="emit('delete', document)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p v-if="filteredDocuments.length === 0" class="no-documents">
        {{ t('playground.documents.empty') }}
      </p>
    </div>
  </Foldable>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from '@fuyeor/vue-router';
import { useLocale } from '@fuyeor/locale';
import { getIconUrl } from '@fuyeor/commons';
import { Foldable } from '@fuyeor/interactify';
import type { HistoryDocument } from '@/composables/useIndexedDb';

const props = defineProps<{
  documents: HistoryDocument[];
  currentDocumentId: string;
}>();

const emit = defineEmits<{
  delete: [document: HistoryDocument];
}>();

const route = useRoute();
const { t, locale } = useLocale();
const searchQuery = ref('');

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  if (!query) return props.documents;

  return props.documents.filter(
    (document) =>
      document.title.toLocaleLowerCase().includes(query) ||
      document.content.toLocaleLowerCase().includes(query),
  );
});

// Format relative timestamps in the active locale.
const formatTime = (timestamp: number): string => {
  const diff = Math.max(0, window.Date.now() - timestamp);
  if (diff < 60000) return t('playground.documents.justNow');
  if (diff < 3600000)
    return t('playground.documents.minutesAgo', {
      value: Math.floor(diff / 60000),
    });
  if (diff < 86400000)
    return t('playground.documents.hoursAgo', {
      value: Math.floor(diff / 3600000),
    });
  if (diff < 172800000) return t('playground.documents.yesterday');
  if (diff < 604800000)
    return t('playground.documents.daysAgo', {
      value: Math.floor(diff / 86400000),
    });
  if (diff < 2592000000)
    return t('playground.documents.weeksAgo', {
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
.document-history {
  margin: 10px;
}

.document-history-title {
  margin: 0;
  color: var(--text-primary, #2d3748);
  font-size: 18px;
  font-weight: 600;
}

.document-search-container {
  position: relative;
  padding: 8px 10px;
}

.document-search-input {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 6px;
  color: var(--text-primary, #2d3748);
  background: var(--surface-raised, #ffffff);
  font-size: 13px;
  outline: none;
}

.document-search-input:focus {
  border-color: #9f7aea;
}

.document-list {
  display: flex;
  max-height: calc(100vh - 200px);
  margin-top: 8px;
  flex-direction: column;
  gap: 4px;
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
  border-radius: 8px;
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
  background-color: #f3ebff;
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
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.document-title,
.document-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-title {
  margin-bottom: 4px;
  color: var(--text-primary, #2d3748);
  font-size: 14px;
}

.document-item.active .document-title {
  color: #553c9a;
  font-weight: 500;
}

.document-time {
  color: var(--text-secondary, #a0aec0);
  font-size: 12px;
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
