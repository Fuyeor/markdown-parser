<!-- @/option/component/RootView.vue -->
<template>
  <template v-if="isCurrentRoute">
    <!-- 使用数据驱动的菜单组件 -->
    <option-menu-component :menu="menu" />
  </template>

  <!-- 子路由内容将在这里展示 -->
  <router-view v-else />
</template>

<script setup lang="ts">
import OptionMenuComponent from '@/option/component/menu.vue';

import { computed } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useRoute } from '@fuyeor/vue-router';
import type { OptionMenu } from '@/option/type';

const props = defineProps<{
  routeName: string; // 当前路由的 name
  menu: OptionMenu; // 菜单配置
}>();

const { t } = useLocale();
const route = useRoute();

// 判断当前是否是 /options/{routeName} 这个根路径
const isCurrentRoute = computed(() => route.name === props.routeName);
</script>