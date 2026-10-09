<!-- @/option/component/menu.vue -->
<template>
  <aside :class="$style['settings-menu']">
    <!--<h2 class="menu-header">{{ t(menu.title) }}</h2>-->
    <p v-if="menu.description" :class="$style['menu-description']">
      {{ t(menu.description) }}
    </p>

    <!-- 遍历菜单组 -->
    <template v-for="(group, groupIndex) in menu.groups" :key="groupIndex">
      <h3 class="menu-h3" v-if="group.title" :id="group.id">
        {{ t(group.title) }}
      </h3>

      <!-- 遍历组内的菜单项 -->
      <template v-for="item in group.items" :key="item.to">
        <!-- 优化：使用 isItemVisible 函数进行判断，保持模板干净 -->
        <OptionMenuItem
          v-if="isItemVisible(item)"
          :icon="item.icon"
          :title="t(item.title)"
          :description="t(item.description)"
          :to="item.to"
        />
      </template>
    </template>
  </aside>
</template>

<script setup lang="ts">
import OptionMenuItem from '@/option/component/item.vue';

import { useLocale } from '@fuyeor/locale';
import type { OptionMenu, MenuItem } from '@/option/type';

// 接收菜单配置对象
defineProps<{
  menu: OptionMenu;
}>();

const { t } = useLocale();

// 权限判断逻辑函数
const isItemVisible = (item: MenuItem): boolean => {
  // 其他所有情况都不可见
  return true;
};
</script>

<style module>
.settings-menu {
  position: sticky;
  top: 0;
  width: 280px;
  height: 100%;
  border-right: var(--border-subtle);

  .menu-description {
    padding: 0.5rem 1rem;
  }
}
</style>
