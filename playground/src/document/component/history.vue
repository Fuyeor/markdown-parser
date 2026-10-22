<!-- @/document/component/history.vue -->
<template>
  <!-- only shows when user created example doc -->
  <Foldable
    v-if="documents.length !== 0"
    :title="t('document')"
    :model-value="true"
    :icon-url="getIconUrl('learn')"
    class="document-history"
  >
    <div class="document-search-container">
      <input
        v-model="searchQuery"
        type="search"
        class="document-search-input"
        :placeholder="t('document.search')"
        :aria-label="t('document.search')"
      />

      <DropdownMenu
        class="menu-btn"
        :aria-label="t('document.actions')"
        :items="menu"
      />
    </div>

    <Modal v-model="isDeleteAllModalOpen" size="small">
      <template #header>
        <h3>{{ t('document.deleteAll') }}</h3>
      </template>
      {{ t('document.deleteAll.confirm', { day: 21 }) }}
      <template #footer>
        <div class="confirm-dialog-actions">
          <button
            type="button"
            class="action-btn secondary"
            @click="isDeleteAllModalOpen = false"
          >
            {{ t('cancel') }}
          </button>
          <button
            type="button"
            class="action-btn danger"
            @click="handleDeleteAll"
          >
            {{ t('confirm') }}
          </button>
        </div>
      </template>
    </Modal>

    <div class="document-list">
      <router-link
        v-for="document in filteredDocuments"
        :key="document.id"
        :to="{
          name: 'Document',
          params: { ...route.params, id: document.id },
        }"
        class="document-item"
        :class="{ active: currentDocumentId === document.id }"
      >
        <img
          v-if="document.pinned !== undefined"
          alt=""
          class="document-pin"
          :src="pinIcon"
        />
        <span class="document-info">
          <span class="document-title">{{
            document.title || t('document.untitled')
          }}</span>
          <span class="document-time">
            {{ formatTime(document.updated) }}
            <span
              v-if="document.word !== undefined"
              class="document-word-count"
            >
              {{ t('document.stat.word', { count: document.word }) }}
            </span>
            <DropdownMenu
              :aria-label="`${t('delete')}: ${document.title}`"
              :items="docMenu(document)"
              @click.stop.prevent
            />
          </span>
        </span>
      </router-link>
    </div>
  </Foldable>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { t } from '@fuyeor/vue-locale';
import { getIconUrl, getTwemojiUrl } from '@fuyeor/commons';
import {
  toast,
  Modal,
  Foldable,
  DropdownMenu,
  type DropdownItem,
} from '@fuyeor/interactify';
import {
  useIndexedDb,
  type HistoryDocument,
} from '@/document/composable/useIndexedDb';
import { formatTime } from '@/document/util/formatTime';

const route = useRoute();
const router = useRouter();

const { documents, favorite, deleteOne, deleteAll, purgeEmpty } =
  useIndexedDb();

const pinIcon = getTwemojiUrl('⭐');

const searchQuery = ref('');
const isDeleteAllModalOpen = ref(false);
const currentDocumentId = computed(() => String(route.params.id ?? ''));

const emptyCount = computed(
  () => documents.value.filter((document) => !document.word).length,
);

const menu = computed<DropdownItem[]>(() => {
  const item: DropdownItem[] = [];

  item.push({
    label: t('document.deleted'),
    action: () => router.push({ name: 'Document.Deleted' }),
  });

  if (emptyCount.value > 0) {
    item.push({
      label: t('document.deleteEmpty'),
      action: () => void handleDeleteEmpty(),
    });
  }

  item.push({
    label: t('document.deleteAll'),
    action: () => {
      isDeleteAllModalOpen.value = true;
    },
    class: 'text-danger',
  });

  return item;
});

const docMenu = (document: HistoryDocument): DropdownItem[] => [
  {
    label:
      document.pinned === undefined
        ? t('document.pin')
        : t('document.pin.cancel'),
    action: () => void favorite(document.id),
  },
  {
    label: t('document.delete'),
    action: () => handleDeleteOne(document),
  },
];

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  const list = query
    ? documents.value.filter(
        (document) =>
          document.title.toLocaleLowerCase().includes(query) ||
          document.content.toLocaleLowerCase().includes(query),
      )
    : documents.value;

  // Pinned documents first, then by updated desc within each group.
  return list.toSorted((a, b) => {
    const aPinned = a.pinned === undefined ? 0 : 1;
    const bPinned = b.pinned === undefined ? 0 : 1;
    return bPinned - aPinned || b.updated - a.updated;
  });
});

// Delete the local document and clear the current route when needed.
const handleDeleteOne = async (document: HistoryDocument) => {
  await deleteOne(document.id);
  if (currentDocumentId.value !== document.id) return;

  router.replace({
    name: 'Document',
    params: { ...route.params, id: undefined },
  });
};

// Clear all local documents and leave the active document route when necessary.
const handleDeleteEmpty = async () => {
  const idArray = await purgeEmpty();
  if (idArray.length > 0)
    toast.show(t('document.deleteEmpty.count', { count: idArray.length }), {
      type: 'success',
    });
  if (!idArray.includes(currentDocumentId.value)) return;

  await router.replace({
    name: 'Document',
    params: { ...route.params, id: undefined },
  });
};

const handleDeleteAll = async () => {
  await deleteAll();
  isDeleteAllModalOpen.value = false;
  if (route.name !== 'Document' || !currentDocumentId.value) return;

  await router.replace({
    name: 'Document',
    params: { ...route.params, id: undefined },
  });
};
</script>

<style>
.foldable-content {
  padding: 0 10px;
}

.document-history {
  margin: 0 10px 10px;
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
  padding: 6px 0 28px;
}

.document-search-input {
  width: 100%;
  min-width: 0;
  padding: 12px 14px;
  border: none;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  background-color: var(--surface-raised-hover);
  font-size: 0.85rem;

  &:focus {
    box-shadow: var(--input-border-shadow);
  }
}

.document-list {
  display: flex;
  max-height: calc(100vh - 200px);
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.document-item {
  position: relative;
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

.document-info {
  display: flex;
  flex: 1;
  gap: 6px;
  flex-direction: column;
  min-width: 0;
}

.document-pin {
  position: absolute;
  top: 8px;
  left: 2px;
  height: 1em;
  pointer-events: none;
  transform: rotate(280deg);
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

@media (width <= 900px) {
  .document-item {
    padding: 10px 0 10px 16px;
  }
  .document-pin {
    top: 8px;
    left: -6px;
  }
}
</style>
