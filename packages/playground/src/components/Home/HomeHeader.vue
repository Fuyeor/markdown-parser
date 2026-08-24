<!-- @/components/Home/HomeHeader.vue -->
<template>
  <header class="topbar">
    <a class="brand-lockup" href="#top" aria-label="FFM 首页">
      <img
        src="https://deliver.fuyeor.net/@fu/trademark/tm/official.png"
        alt="FFM 图形标志"
      />
      <span class="editorial-wordmark">
        <b>fuyeor</b>
        <i>flavored markdown</i>
      </span>
    </a>

    <nav class="desktop-nav" aria-label="主导航">
      <a href="#editorial">Why FFM</a>
      <router-link :to="playgroundLink">Playground</router-link>
      <a href="#features">Features</a>
      <a href="#notes">Notes</a>
    </nav>

    <div class="header-actions">
      <button
        class="theme-toggle"
        type="button"
        :aria-pressed="isDark"
        aria-label="切换颜色主题"
        @click="$emit('toggle-theme')"
      >
        <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
        <span>{{ isDark ? 'Light' : 'Night' }}</span>
      </button>
      <router-link :to="playgroundLink" class="top-cta"
        >Write a line <span aria-hidden="true">↗</span></router-link
      >
    </div>
  </header>
</template>

<script setup lang="ts">
import { usePlaygroundLink } from '@/composables/usePlaygroundLink';

defineProps<{
  isDark: boolean;
}>();

defineEmits<{
  'toggle-theme': [];
}>();

const playgroundLink = usePlaygroundLink();
</script>

<style scoped>
.topbar {
  position: relative;
  z-index: 10;
  display: flex;
  width: min(1420px, calc(100% - 72px));
  min-height: 77px;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
  border-bottom: 1px solid var(--line);
}

.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.brand-lockup img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.editorial-wordmark {
  display: grid;
  gap: 0;
  color: var(--ink);
  line-height: 0.75;
}

.editorial-wordmark b {
  font:
    400 18px/1 'DM Serif Display',
    Georgia,
    serif;
  letter-spacing: -0.07em;
}

.editorial-wordmark i {
  color: var(--lilac-deep);
  font:
    500 7px/1.15 'IBM Plex Mono',
    ui-monospace,
    monospace;
  font-style: normal;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 29px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.desktop-nav a {
  transition: color 180ms var(--ease-out);
}

.desktop-nav a:hover {
  color: var(--lilac-deep);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 13px;
}

.theme-toggle,
.top-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  transition:
    transform 160ms var(--ease-out),
    background-color 180ms var(--ease-out),
    color 180ms var(--ease-out);
}

.theme-toggle {
  padding: 9px 7px;
  color: var(--ink-soft);
  background: transparent;
  font-size: 12px;
  font-weight: 700;
}

.theme-toggle:hover {
  color: var(--ink);
}

.top-cta {
  position: relative;
  padding: 11px 15px;
  color: var(--ink);
  border-radius: 2px;
  background: var(--lilac);
  box-shadow: 3px 3px 0 rgba(36, 53, 75, 0.18);
  font-size: 12px;
  font-weight: 800;
}

.top-cta::before {
  color: rgba(36, 53, 75, 0.52);
  content: '#';
  font:
    500 10px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
}

.top-cta:hover {
  background: #c0b8ed;
  box-shadow: 5px 5px 0 rgba(36, 53, 75, 0.14);
  transform: translate(-1px, -2px);
}

.top-cta:active,
.theme-toggle:active {
  transform: scale(0.97);
}

@media (width <= 900px) {
  .topbar {
    width: min(100% - 36px, 700px);
  }

  .desktop-nav,
  .top-cta {
    display: none;
  }
}

@media (width <= 490px) {
  .topbar {
    width: calc(100% - 32px);
    min-height: 66px;
  }

  .brand-lockup img {
    width: 29px;
    height: 29px;
  }

  .editorial-wordmark b {
    font-size: 15px;
  }

  .editorial-wordmark i {
    font-size: 6px;
  }

  .theme-toggle > span:last-child {
    display: none;
  }
}
</style>
