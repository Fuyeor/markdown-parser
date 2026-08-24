<!-- @/components/Playground/DocumentStatsBar.vue -->
<template>
  <footer class="document-stats-bar">
    <span
      >{{ t('documents.createdAt') }}:
      {{ formatDate(createdAt, { preset: 'relative', short: true }) }}</span
    >
    <span
      >{{ t('documents.updatedAt') }}:
      {{ formatDate(updatedAt, { preset: 'relative', short: true }) }}</span
    >
    <span>{{ t('documents.stats.words', { count: stats.words }) }}</span>
    <span>{{
      t('documents.stats.characters', { count: stats.characters })
    }}</span>
    <span>{{
      t('documents.stats.sentences', { count: stats.sentences })
    }}</span>
    <span>{{
      t('documents.stats.paragraphs', { count: stats.paragraphs })
    }}</span>
  </footer>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';
import { useDateFormatter } from '@fuyeor/commons';
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

const { t } = useLocale();
const { formatDate } = useDateFormatter();
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
