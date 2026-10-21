<!-- @app/component/right.vue -->
<template>
  <div class="right-sidebar">
    <div id="sidebar-wrapper"></div>

    <right-footer>
      <template #front-slot>
        <a
          target="_blank"
          class="link-item ext-link"
          href="https://www.fuyeor.com/@ffm"
        >
          Ф
        </a>

        <span class="footer-separator">/</span>

        <a
          target="_blank"
          class="link-item ext-link"
          href="https://github.com/Fuyeor/markdown-parser"
        >
          GitHub
        </a>

        <span class="footer-separator">/</span>
      </template>
    </right-footer>
  </div>
</template>

<script setup lang="ts">
import { RightFooter } from '@fuyeor/interactify';
</script>
