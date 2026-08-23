<!-- @/components/Playground/DocumentStatsBar.vue -->
<template>
  <footer class="document-stats-bar" aria-label="Document statistics">
    <span>{{ t('playground.documents.createdAt') }}: {{ formatDate(createdAt) }}</span>
    <span>{{ t('playground.documents.updatedAt') }}: {{ formatDate(updatedAt) }}</span>
    <span>{{ t('playground.documents.words') }}: {{ stats.words }}</span>
    <span>{{ t('playground.documents.characters') }}: {{ stats.characters }}</span>
    <span>{{ t('playground.documents.sentences') }}: {{ stats.sentences }}</span>
    <span>{{ t('playground.documents.paragraphs') }}: {{ stats.paragraphs }}</span>
  </footer>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';
import type { DocumentStats } from '@/composables/useDocumentStats';

withDefaults(
  defineProps<{
    createdAt?: number;
    updatedAt?: number;
    stats: DocumentStats;
  }>(),
  {
    createdAt: 0,
    updatedAt: 0,
  },
);

const { t, locale } = useLocale();

// Format document timestamps consistently with the active locale.
const formatDate = (timestamp: number): string => {
  if (!timestamp) return '—';
  return new window.Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
};
</script>

<style>
.document-stats-bar {
  display: flex;
  min-height: 32px;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  padding: 6px 16px;
  border-top: var(--border-default);
  color: var(--text-secondary);
  background: var(--surface-top);
  font-size: 12px;
  line-height: 1.4;
}
</style>
