<!-- @app/component/right.vue -->
<template>
  <div class="right-sidebar">
    <div id="sidebar-wrapper"></div>

    <RightFooter>
      <template #dynamic-links>
        <a
          target="_blank"
          class="footer-link ext-link to-front"
          href="https://github.com/Fuyeor/markdown-parser"
        >
          GitHub
        </a>
        <span class="footer-separator to-front">/</span>
      </template>
    </RightFooter>
  </div>
</template>

<script setup lang="ts">
import { RightFooter } from '@fuyeor/interactify';
</script>

<style>
/* 让 footer-links 成为 flex 容器，order 才能生效 */
.right-sidebar .footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* 插槽内容整体排到前面 */
.right-sidebar .footer-links > .to-front {
  order: -1;
}

/* 干掉组件里“slot 前”的 / —— 因为槽内容跑到前面后，它会落到视觉末尾 */
.right-sidebar .footer-links > .dropdown-menu-container + .footer-separator {
  display: none;
}
</style>
