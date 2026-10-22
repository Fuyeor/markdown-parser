<!-- @app/component/left.vue -->
<template>
  <left-sidebar>
    <template #nav>
      <router-link class="nav-item" :to="{ name: 'Home' }">
        <img :src="getIconUrl('home')" class="nav-icon" alt="" />
        <p class="nav-text">{{ t('home') }}</p>
      </router-link>

      <router-link
        class="nav-item"
        :to="{
          name: 'Document',
          params: { ...route.params, id: undefined },
          query: { mode: 'rich' },
        }"
      >
        <img :src="getIconUrl('extension')" class="nav-icon" alt="" />
        <p class="nav-text">{{ t('editor') }}</p>
      </router-link>

      <router-link
        class="nav-item"
        :to="{
          name: 'Document',
          params: { ...route.params, id: undefined },
          query: { mode: 'code' },
        }"
      >
        <img :src="getIconUrl('palette')" class="nav-icon" alt="" />
        <p class="nav-text">{{ t('playground') }}</p>
      </router-link>

      <document-history />
    </template>
  </left-sidebar>
</template>

<script setup lang="ts">
import DocumentHistory from '@/document/component/history.vue';

import { t } from '@fuyeor/vue-locale';
import { getIconUrl } from '@fuyeor/commons';
import { useRoute, useRouter } from '@fuyeor/vue-router';
import { LeftSidebar } from '@fuyeor/interactify';

const route = useRoute();
const router = useRouter();
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
}
</style>
