<!-- @/option/index.vue -->
<template>
  <!-- 桌面端逻辑 -->
  <modal
    v-if="!isMobile"
    size="large"
    padding="none"
    :model-value="true"
    @update:model-value="handleClose"
  >
    <div class="option-hub-layout">
      <option-menu :menu="dashboardMenu" />

      <div class="option-content">
        <RouterView />
      </div>
    </div>
  </modal>

  <!-- 移动端逻辑 -->
  <AsyncSheet v-else :model-value="true" @update:model-value="handleClose">
    <div class="mobile-option-container">
      <!-- 移动端交互：首页显示菜单，点击后显示子页面内容 -->
      <option-menu v-if="isRootOptions" :menu="dashboardMenu" />
      <RouterView v-else />
    </div>
  </AsyncSheet>
</template>

<script setup lang="ts">
import OptionMenu from '@/option/component/menu.vue';

import { ref, computed, defineAsyncComponent } from 'vue';
import { useRouter, useRoute, RouterView } from '@fuyeor/vue-router';
import { Modal, isMobile } from '@fuyeor/interactify';
import { dashboardMenu } from '@/option/menu';

const router = useRouter();
const route = useRoute();

const sheetOpen = ref(true);

const AsyncSheet = defineAsyncComponent(() =>
  import('@fuyeor/interactify').then((m) => m.SheetMenu),
);

const isRootOptions = computed(() => route.name === 'Option');

const handleClose = (open: boolean) => {
  sheetOpen.value = open;
  if (open) return;

  if (window.navigation.canGoBack) {
    router.back();
  } else {
    sheetOpen.value = false;
  }
};
</script>

<style scoped>
/* 桌面端布局 */
.option-hub-layout {
  display: flex;
  align-items: flex-start;
  height: 100%; /* 填满大 Modal */
  width: 100%;
  overflow: hidden; /* 确保这一层绝对不产生多余滚动条 */

  @media (width <= 900px) {
    padding: 0;
    scrollbar-width: none;
  }
}

.option-content {
  flex: 1;
  height: 100%; /* 填满大 Modal */
  overflow: hidden; /* 也是绝对不产生滚动条 */
}

.mobile-option-container {
  /* 限制最大高度为 85vh，防止在 iPhone 上顶死顶部状态栏 */
  max-height: 85vh;
  min-height: 40vh;
  padding: 1rem 1rem 3rem;
  overflow-y: auto; /* 允许在抽屉内部滚动设置项 */
  border-radius: var(--radius-lg);

  @media (width <= 900px) {
    padding: 0;
    scrollbar-width: none;
  }
}
</style>
