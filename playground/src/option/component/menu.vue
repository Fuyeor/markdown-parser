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
        <OptionMenuItem
          :icon="item.icon"
          :title="t(item.title)"
          :description="item.description ? t(item.description) : undefined"
          :to="item.to"
        />
      </template>
    </template>
  </aside>
</template>

<script setup lang="ts">
import OptionMenuItem from '@/option/component/item.vue';

import { t } from '@fuyeor/vue-locale';
import type { OptionMenu } from '@/option/type';

// 接收菜单配置对象
defineProps<{
  menu: OptionMenu;
}>();
</script>

<style module>
.settings-menu {
  position: sticky;
  top: 0;
  width: 280px;
  padding: 20px 0;
  height: 100%;
  border-right: var(--border-subtle);

  .menu-description {
    padding: 0.5rem 1rem;
  }

  @media (width <= 900px) {
    width: 100%;
    border: none;
    padding: 0;
  }
}
</style>
