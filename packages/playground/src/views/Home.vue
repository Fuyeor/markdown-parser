<!-- @/views/Home.vue -->
<template>
  <div class="site-shell" :class="{ night: isDark }">
    <div class="paper-grain" aria-hidden="true" />
    <div class="page-spine" aria-hidden="true">
      <span class="spine-dot" />
      <span class="spine-line" />
      <span class="spine-flower">✦</span>
    </div>

    <HomeHeader :is-dark="isDark" @toggle-theme="toggleTheme" />

    <main id="top">
      <HomeHero />
      <HomeIntro />
      <HomeStatement />
      <HomeFeatures />
      <HomeCampaign />
    </main>

    <HomeFooter />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import HomeCampaign from '@/components/Home/HomeCampaign.vue';
import HomeFeatures from '@/components/Home/HomeFeatures.vue';
import HomeFooter from '@/components/Home/HomeFooter.vue';
import HomeHeader from '@/components/Home/HomeHeader.vue';
import HomeHero from '@/components/Home/HomeHero.vue';
import HomeIntro from '@/components/Home/HomeIntro.vue';
import HomeStatement from '@/components/Home/HomeStatement.vue';

const isDark = ref(false);

// Scope page-level scrolling to Home while preserving the Playground layout.
onMounted(() => {
  document.body.classList.add('home-page');
});

onBeforeUnmount(() => {
  document.body.classList.remove('home-page');
});

// Toggle only the Home presentation theme; the existing Playground stays unchanged.
const toggleTheme = () => {
  isDark.value = !isDark.value;
};
</script>

<style scoped>
.site-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--ink);
  background: var(--paper);
}

.site-shell.night {
  --ink: #f0eff5;
  --ink-soft: #b7b6c4;
  --paper: #11101c;
  --paper-deep: #191827;
  --lilac-pale: #292743;
  --line: rgba(239, 238, 247, 0.12);
  --card: rgba(30, 29, 44, 0.9);
}

.paper-grain {
  position: fixed;
  z-index: 20;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.1'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
  opacity: 0.35;
}

.page-spine {
  position: absolute;
  z-index: 3;
  top: 108px;
  bottom: 73px;
  left: max(20px, calc((100vw - 1480px) / 2));
  display: flex;
  align-items: center;
  flex-direction: column;
  color: var(--lilac);
  pointer-events: none;
}

.spine-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--lilac);
  box-shadow: 0 0 0 7px rgba(174, 164, 228, 0.16);
}

.spine-line {
  width: 1px;
  min-height: 520px;
  flex: 1;
  margin-top: 12px;
  background: repeating-linear-gradient(
    to bottom,
    var(--lilac) 0 5px,
    transparent 5px 14px
  );
  opacity: 0.72;
}

.spine-flower {
  position: absolute;
  bottom: -8px;
  padding: 3px 0;
  background: var(--paper);
  font-size: 23px;
}

@media (prefers-reduced-motion: no-preference) {
  .site-shell :deep(.hero-copy > *),
  .site-shell :deep(.hero-portrait-wrap),
  .site-shell :deep(.feature-image-block),
  .site-shell :deep(.feature-list-wrap) {
    animation: enter-up 800ms var(--ease-out) both;
  }

  .site-shell :deep(.hero-copy > *:nth-child(2)) {
    animation-delay: 60ms;
  }

  .site-shell :deep(.hero-copy > *:nth-child(3)) {
    animation-delay: 120ms;
  }

  .site-shell :deep(.hero-copy > *:nth-child(4)) {
    animation-delay: 180ms;
  }

  .site-shell :deep(.hero-copy > *:nth-child(5)) {
    animation-delay: 240ms;
  }

  .site-shell :deep(.hero-portrait-wrap) {
    animation-delay: 130ms;
  }

  @keyframes enter-up {
    from {
      opacity: 0;
      transform: translateY(17px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

@media (width <= 900px) {
  .page-spine {
    display: none;
  }
}
</style>
