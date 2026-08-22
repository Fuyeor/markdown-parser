<!-- @/layout/Left.vue -->
<template>
  <LeftSidebar>
    <template #nav>
      <SidebarMenu :items="sidebarItems" />

      <div id="left-sidebar-anchor"></div>
    </template>
  </LeftSidebar>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';
import { useSidebarItems } from '@fuyeor/interactify';
import { LeftSidebar, SidebarMenu } from '@fuyeor/interactify';
import { sidebarItemsRaw } from '@/config/sidebar/menu.config';

const { t } = useLocale();

const { processedItems: sidebarItems } = useSidebarItems(sidebarItemsRaw, {
  t,
});
</script>

<style>
.left-sidebar {
  .nav p {
    font-size: 1.25rem;
  }

  .nav img {
    width: 1.75rem;
  }
}
</style>
