<!-- @fuyeor/markdown-parser-playground/src/App.vue -->
<template>
  <LeftSidebar />
  <main>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterView } from '@fuyeor/vue-router';
import { LeftSidebar } from '@fuyeor/interactify';
</script>
