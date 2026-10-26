<!-- @/home/component/statement.vue -->
<template>
  <section class="statement-section">
    <section-label number="02" syntax="#">
      {{ t('home.statement.label') }}
    </section-label>

    <div v-for="item in statement" :key="item.title" class="statement-grid">
      <h2>{{ t(item.title) }}</h2>
      <div class="statement-side">
        <p>{{ t(item.desc) }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import SectionLabel from './section-label.vue';

import { t } from '@fuyeor/vue-locale';

const statement = [
  {
    title: 'home.statement.progressive.title',
    desc: 'home.statement.progressive.desc',
  },
  {
    title: 'home.statement.efficiency.title',
    desc: 'home.statement.efficiency.desc',
  },
  {
    title: 'home.statement.web.title',
    desc: 'home.statement.web.desc',
  },
];
</script>

<style scoped>
h2 {
  border: none;
}

.statement-section {
  width: var(--section-width);
  margin: 0 auto;
  padding: 40px 0 100px;
}

.statement-grid {
  display: grid;
  align-items: end;
  margin-top: 40px;

  h2 {
    margin: 0;
    font-family: var(--serif-font);
    font-weight: 400;
    font-size: 2rem;
    letter-spacing: -0.057em;
  }

  h2 {
    position: relative;
    width: fit-content;
    isolation: isolate;
  }

  h2::after {
    content: '';
    position: absolute;
    z-index: -1;
    left: -8px;
    right: -8px;
    bottom: 4px;
    height: 3.4rem;
    background: var(--paper-deep);
    opacity: 0.65;
    transform: rotate(-1deg);
    border-radius: 6px;
  }
}

.statement-side {
  p {
    margin: 0 0 26px;
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.9;
  }

  /*
  a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--lilac);
    font-size: 13px;
    font-weight: 800;
  }

  a:hover {
    color: var(--lilac-deep);
  }
  */
}

@media (width <= 900px) {
  .statement-section {
    width: min(100% - 54px, 650px);
    padding: 30px 0;
  }

  .statement-grid {
    grid-template-columns: 1fr;
    gap: 37px;
  }
}

@media (width <= 490px) {
  .statement-section {
    width: calc(100% - 40px);
  }
}

.feature-section {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: var(--section-width);
  margin: 0 auto;
  padding: 74px 0 52px;
}

.feature-section::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 -3rem;
  background: var(--paper-deep);
  border-radius: var(--radius-md);
  pointer-events: none;
}

@media (width <= 900px) {
  .feature-section {
    width: 100%;
    padding: 57px 20px 40px;
  }

  .feature-section::before {
    inset: 0;
    border-radius: 0;
  }
}
</style>
