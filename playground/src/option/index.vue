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
    <div :class="$style['option-hub-layout']">
      <option-menu :menu="dashboardMenu" />

      <div :class="$style['option-content']">
        <RouterView />
      </div>
    </div>
  </modal>

  <!-- 移动端逻辑 -->
  <AsyncSheet v-else :model-value="true" @update:model-value="handleClose">
    <div :class="$style['mobile-option-container']">
      <!-- 移动端交互：首页显示菜单，点击后显示子页面内容 -->
      <option-menu v-if="isRootOptions" :menu="dashboardMenu" />
      <RouterView v-else />
    </div>
  </AsyncSheet>
</template>

<script setup lang="ts">
import OptionMenu from '@/option/component/menu.vue';

import { computed, defineAsyncComponent } from 'vue';
import { useRouter, useRoute, RouterView } from '@fuyeor/vue-router';
import { useLocale } from '@fuyeor/locale';
import { Modal, useMobileDetection } from '@fuyeor/interactify';
import { dashboardMenu } from '@/option/dashboard-menu';

const router = useRouter();
const route = useRoute();

const { t } = useLocale();
const { isMobile } = useMobileDetection();

const AsyncSheet = defineAsyncComponent(() =>
  import('@fuyeor/interactify').then((m) => m.SheetMenu),
);

const isRootOptions = computed(() => route.name === 'Option');

const handleClose = () => {
  router.back();
};
</script>

<style module>
/* 桌面端布局 */
.option-hub-layout {
  display: flex;
  align-items: flex-start;
  height: 100%; /* 填满大 Modal */
  width: 100%;
  overflow: hidden; /* 确保这一层绝对不产生多余滚动条 */
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

  @media (width <= 900px) {
    padding: 0;
    scrollbar-width: none;
  }
}
</style>
