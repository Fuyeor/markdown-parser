<!-- @/App.vue -->
<template>
  <left-sidebar />

  <main>
    <router-view />
  </main>
</template>

<script setup lang="ts">
import LeftSidebar from '@/layout/Left.vue';

import { useHeadManager } from '@fuyeor/commons';
import { useFontLoader } from '@fuyeor/interactify';

// load font
useFontLoader();
// load title manager
useHeadManager({
  nameKey: 'site.name',
  titleKey: 'site.title',
});
</script>
