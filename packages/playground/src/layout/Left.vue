<!-- @/layout/Left.vue -->
<template>
  <LeftSidebar>
    <template #nav>
      <SidebarMenu :items="sidebarItems" />

      <DocumentHistory
        :documents="documents"
        :current-document-id="currentDocumentId"
        @delete="deleteDocument"
      />
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
import DocumentHistory from '@/components/Playground/DocumentHistory.vue';
import PlaygroundShare from '@/components/Playground/PlaygroundShare.vue';

import { computed } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import {
  LeftSidebar,
  SidebarMenu,
  LocaleSwitcher,
  useSidebarItems,
} from '@fuyeor/interactify';
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



const deleteDocument = async (document: HistoryDocument) => {
  await removeDocument(document.id);
  if (currentDocumentId.value !== document.id) return;

  router.replace({
    name: 'Playground',
    params: { ...route.params, id: undefined },
  });
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

  .foldable-header {
    margin: 10px 0;
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
