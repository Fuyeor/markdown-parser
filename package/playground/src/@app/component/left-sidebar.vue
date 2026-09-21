<!-- @app/component/left-sidebar.vue -->
<template>
  <left-sidebar>
    <template #nav>
      <SidebarMenu :items="sidebarNav" />
      <router-link
        :to="{ name: 'Playground', params: { ...route.params, id: undefined } }"
        class="nav-item"
      >
        <img :src="getIconUrl('palette')" class="nav-icon" alt="" />
        <p class="nav-text">{{ t('playground') }}</p>
      </router-link>

      <document-history />
    </template>

    <template #footer>
      <LocaleSwitcher
        :supported-locales="supportedLocale"
        @change="handleLocaleChange"
      />
    </template>
  </left-sidebar>
</template>

<script setup lang="ts">
import DocumentHistory from '@/playground/component/history.vue';

import { useLocale } from '@fuyeor/locale';
import { getIconUrl } from '@fuyeor/commons';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import {
  LeftSidebar,
  SidebarMenu,
  LocaleSwitcher,
  useSidebarItems,
} from '@fuyeor/interactify';
import { rawSidebarNav } from '@app/config/sidebar/menu';
import { supportedLocale } from '@app/config/locale';

const route = useRoute();
const router = useRouter();

const { t } = useLocale();

const { processedItems: sidebarNav } = useSidebarItems(rawSidebarNav, {
  t,
});

const handleLocaleChange = (newLocale: string) => {
  router.replace({
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
  .footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid #edf0f2;
  }
}
</style>
