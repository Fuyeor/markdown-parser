<!-- @/document/deleted.vue -->
<template>
  <header-bar :title="t('document.deleted')" />

  <div class="content-layout">
    <header-section
      :title="t('document.deleted')"
      :description="t('document.deleted.desc', { day: 21 })"
      :action-text="t('document.deleted.purgeAll')"
      :disabled-text="trashed.length > 0 ? '' : undefined"
      @action="isPurgeAllModalOpen = true"
    />

    <p v-if="trashed.length === 0" class="deleted-empty">
      {{ t('document.deleted.empty') }}
    </p>

    <ul v-else class="deleted-list">
      <li v-for="document in trashed" :key="document.id" class="deleted-item">
        <div class="deleted-info">
          <span class="deleted-title">
            {{ document.title || t('document.untitled') }}
          </span>
          <span class="deleted-time">{{ formatTime(document.deleted!) }}</span>
        </div>
        <DropdownMenu
          :aria-label="`${t('document.deleted')}: ${document.title}`"
          :items="docMenu(document)"
        />
      </li>
    </ul>

    <Modal v-model="isPurgeAllModalOpen" size="small">
      <template #header>
        <h3>{{ t('document.deleted.purgeAll') }}</h3>
      </template>
      {{ t('document.deleted.purgeAll.confirm') }}
      <template #footer>
        <div class="confirm-dialog-actions">
          <button
            type="button"
            class="action-btn secondary"
            @click="isPurgeAllModalOpen = false"
          >
            {{ t('cancel') }}
          </button>
          <button
            type="button"
            class="action-btn danger"
            @click="handlePurgeAll"
          >
            {{ t('confirm') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLocale } from '@fuyeor/locale';
import {
  HeaderBar,
  HeaderSection,
  Modal,
  DropdownMenu,
  type DropdownItem,
} from '@fuyeor/interactify';
import {
  useIndexedDb,
  type HistoryDocument,
} from '@/document/composable/useIndexedDb';
import { useFormatTime } from '@/document/composable/useFormatTime';

const { t } = useLocale();
const { trashed, purgeOne, purgeAll, restoreOne } = useIndexedDb();
const { formatTime } = useFormatTime();

const isPurgeAllModalOpen = ref(false);

const docMenu = (document: HistoryDocument): DropdownItem[] => [
  {
    label: t('document.deleted.restore'),
    action: () => void restoreOne(document.id),
  },
  {
    label: t('document.deleted.purge'),
    action: () => void purgeOne(document.id),
    class: 'text-danger',
  },
];

const handlePurgeAll = async () => {
  await purgeAll();
  isPurgeAllModalOpen.value = false;
};
</script>

<style>
.btn-primary {
  background-color: var(--color-danger);

  &:hover:not(:disabled) {
    background-color: var(--color-danger);
    opacity: 0.7;
  }
}

.deleted-empty {
  color: var(--text-secondary);
  text-align: center;
}

.deleted-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.deleted-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

.deleted-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.deleted-title,
.deleted-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deleted-title {
  color: var(--text-primary);
  font-size: 0.9rem;
}

.deleted-time {
  color: var(--text-secondary);
  font-size: 0.7rem;
}
</style>
