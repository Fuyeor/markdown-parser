<!-- @/document/component/stats-bar.vue -->
<template>
  <footer class="document-stats-bar">
    <span
      >{{ t('document.createdAt') }}:
      {{ formatDate(createdAt, { preset: 'relative', short: true }) }}</span
    >
    <span
      >{{ t('document.updatedAt') }}:
      {{ formatDate(updatedAt, { preset: 'relative', short: true }) }}</span
    >
    <span>{{ t('document.stat.word', { count: stats.word }) }}</span>
    <span>{{ t('document.stat.character', { count: stats.character }) }}</span>
    <span>{{ t('document.stat.sentence', { count: stats.sentence }) }}</span>
    <span>{{ t('document.stat.paragraph', { count: stats.paragraph }) }}</span>
  </footer>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';
import { useDateFormatter } from '@fuyeor/commons';
import type { TextStat } from '@fuyeor/util';

const { createdAt = 0, updatedAt = 0 } = defineProps<{
  createdAt?: number;
  updatedAt?: number;
  stats: TextStat;
}>();

const { t } = useLocale();
const { formatDate } = useDateFormatter();
</script>

<style>
.document-stats-bar {
  display: flex;
  height: 40px;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  padding: 6px 16px;
  color: var(--text-secondary);
  background: var(--surface-top);
  font-size: 0.75rem;
  line-height: 1.4;

  @media (width <= 900px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    > span {
      flex: none;
    }
    scrollbar-width: none;
  }
}
</style>
