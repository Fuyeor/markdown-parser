<!-- @/option/component/item.vue -->
<template>
  <router-link :to="to" :class="$style['settings-item']" active-class="is-active" v-ripple>
    <!-- 左侧区域：icon + content -->
    <div :class="$style['item-left']">
      <img v-if="icon" :class="$style['item-icon']" :src="icon" />
      <div :class="$style['item-content']">
        <span :class="$style['item-title']">{{ title }}</span>
        <span :class="$style['item-description']">{{ description }}</span>
      </div>
    </div>

    <!-- 右侧箭头 -->
    <svg
      :class="$style['item-chevron']"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      width="22"
    >
      <path
        fill-rule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clip-rule="evenodd"
      />
    </svg>
  </router-link>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from '@fuyeor/vue-router';

// 定义组件接收的 props
defineProps<{
  icon?: string;
  title: string;
  description: string;
  to: RouteLocationRaw;
}>();
</script>

<style module>
.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: inherit;
  padding: 1rem;
  transition: background 0.3s ease-in-out;
}

.settings-item:hover {
  background: var(--surface-raised-hover);
}

/* 左侧区域容器 */
.item-left {
  display: flex;
  align-items: center;
}

.item-icon {
  width: 2rem;
  height: 2rem;
  margin-right: 1.5rem;
  flex-shrink: 0; /* 防止图片被压缩 */
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-title {
  font-weight: 600;
  font-size: 1rem;
}

.item-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.item-chevron {
  flex-shrink: 0;
  color: var(--text-secondary);
}

/* 适应手机屏幕的样式 */
@media (width <= 768px) {
  .settings-item {
    padding: 1rem 1.5rem;
  }
}
</style>