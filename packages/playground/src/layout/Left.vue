<!-- @/layout/Left.vue -->
<template>
  <LeftSidebar>
    <template #nav>
      <SidebarMenu :items="sidebarItems" />
      <div id="left-sidebar-anchor"></div>
      <div class="document-history-panel">
        <button
          type="button"
          class="new-document-button"
          @click="createNewDocument"
        >
          <span aria-hidden="true">+</span>
          {{ t('playground.documents.new') }}
        </button>
        <DocumentHistory
          :documents="documents"
          :current-document-id="currentDocumentId"
          @select="selectDocument"
          @delete="deleteDocument"
        />
      </div>
    </template>

    <template #footer>
      <div class="sidebar-footer">
        <PlaygroundShare />
        <LocaleSwitcher
          :supported-locales="SUPPORTED_LOCALES"
          @change="handleLocaleChange"
        />
      </div>
    </template>
  </LeftSidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import {
  LeftSidebar,
  SidebarMenu,
  LocaleSwitcher,
  useSidebarItems,
} from '@fuyeor/interactify';
import DocumentHistory from '@/components/Playground/DocumentHistory.vue';
import PlaygroundShare from '@/components/Playground/PlaygroundShare.vue';
import { sidebarItemsRaw } from '@/config/sidebar/menu.config';
import { SUPPORTED_LOCALES } from '@/config/locales';
import { useIndexedDb, type HistoryDocument } from '@/composables/useIndexedDb';

const route = useRoute();
const router = useRouter();
const { t } = useLocale();
const { documents, deleteDocument: removeDocument } = useIndexedDb();

const currentDocumentId = computed(() => String(route.params.id ?? ''));

const { processedItems: sidebarItems } = useSidebarItems(sidebarItemsRaw, {
  t,
});

const playgroundParams = (id: string) => ({
  ...(route.params.locale ? { locale: route.params.locale } : {}),
  id,
});

const playgroundPath = () =>
  `${route.params.locale ? `/${route.params.locale}` : ''}/playground`;

const createNewDocument = () => {
  void router.replace(playgroundPath());
};

const selectDocument = (document: HistoryDocument) => {
  void router.replace({
    name: 'Playground',
    params: playgroundParams(document.id),
  });
};

const deleteDocument = async (document: HistoryDocument) => {
  await removeDocument(document.id);

  if (currentDocumentId.value !== document.id) return;
  void router.replace(playgroundPath());
};

const handleLocaleChange = (newLocale: string) => {
  void router.replace({
    name: route.name,
    params: { ...route.params, locale: newLocale },
  });
};
</script>

<style>
.left-sidebar {
  .nav p {
    font-size: 1.25rem;
  }

  .nav img {
    width: 1.75rem;
  }

  .document-history-panel {
    position: relative;
    margin: 16px 8px 0;
  }

  .new-document-button {
    position: absolute;
    top: 10px;
    right: 28px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border: 1px solid var(--border-subtle, #e2e8f0);
    border-radius: 6px;
    color: #6b46c1;
    background: var(--surface-raised, #ffffff);
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.16s ease-out, transform 0.16s ease-out;
  }

  .new-document-button:hover {
    background: #faf5ff;
  }

  .new-document-button:active {
    transform: scale(0.97);
  }

  /* Sidebar footer layout */
  .sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid #edf0f2;
  }
}
</style>
