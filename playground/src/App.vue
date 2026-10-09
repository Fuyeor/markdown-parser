<!-- @/App.vue -->
<template>
  <left-sidebar />

  <main>
    <router-view />
  </main>

  <right-sidebar />

  <toast-provider />
</template>

<script setup lang="ts">
import LeftSidebar from '@app/component/left.vue';
import RightSidebar from '@app/component/right.vue';

import { useHeadManager } from '@fuyeor/commons';
import { ToastProvider, useFontLoader } from '@fuyeor/interactify';
import { useAppearanceState } from '@app/state/appearance';

// load font
useFontLoader();
// load title manager
useHeadManager({
  nameKey: 'site.name',
  titleKey: 'site.title',
});
// apply theme
useAppearanceState();
</script>
