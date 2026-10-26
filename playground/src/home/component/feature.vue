<!-- @/home/component/feature.vue -->
<template>
  <section class="feature-section">
    <section-label number="03">{{ t('home.feature.label') }}</section-label>
    <h2 id="feature-title">
      {{ t('home.feature.titleLead') }}<br /><em>{{
        t('home.feature.titleEmphasis')
      }}</em>
    </h2>
    <div class="feature-list">
      <div v-for="item in feature" :key="item.index" class="feature-row">
        <span class="feature-index">{{ item.index }}</span>
        <div>
          <h3>{{ t(item.titleKey) }}</h3>
          <p>{{ t(item.descriptionKey) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import SectionLabel from './section-label.vue';

import { t } from '@fuyeor/vue-locale';

const feature = [
  {
    index: '01',
    titleKey: 'home.feature.item.format.title',
    descriptionKey: 'home.feature.item.format.description',
  },
  {
    index: '02',
    titleKey: 'home.feature.item.preview.title',
    descriptionKey: 'home.feature.item.preview.description',
  },
  {
    index: '03',
    titleKey: 'home.feature.item.output.title',
    descriptionKey: 'home.feature.item.output.description',
  },
];
</script>

<style scoped>
h2 {
  border: none;
}

.feature-section {
  position: relative;
  isolation: isolate;
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
    box-sizing: border-box;
    padding: 57px 20px 40px;
  }

  .feature-section::before {
    inset-inline: calc((100vw - 100%) / -2);
    border-radius: 0;
  }
}

.feature-section > h2 {
  margin: 28px 0 41px;
  font-family: var(--serif-font);
  font-weight: 400;
  font-size: clamp(43px, 4vw, 60px);
  line-height: 0.95;
  letter-spacing: -0.057em;
}

.feature-section > h2 em {
  color: var(--lilac-deep);
  font-style: normal;
}

.feature-row {
  display: grid;
  grid-template-columns: 42px 1fr 18px;
  gap: 15px;
  padding: 20px 0;
}

.feature-index {
  color: var(--lilac-deep);
  font-size: 0.75rem;
}

.feature-row h3 {
  margin: 0 0 5px;
  font-size: 15px;
  letter-spacing: -0.03em;
}

.feature-row p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.65;
}
</style>
