<!-- @/home/component/campaign.vue -->
<template>
  <section id="notes" class="campaign-section">
    <div class="campaign-copy">
      <section-label number="04">{{ t('home.campaign.label') }}</section-label>
      <blockquote>{{ t('home.campaign.quote') }}</blockquote>
      <p>{{ t('home.campaign.description') }}</p>
      <router-link :to="{ name: 'Document' }" class="button-primary">
        {{ t('home.campaign.cta') }}
      </router-link>
    </div>

    <div class="campaign-image">
      <img
        src="https://deliver.fuyeor.net/@fu/images/ffm-ambassador.webp?v=261025a"
      />
      <div class="campaign-stamp">FFM<br /><span>2026</span></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import SectionLabel from './section-label.vue';

import { t } from '@fuyeor/vue-locale';
</script>

<style scoped>
.campaign-section {
  display: grid;
  width: var(--section-width);
  gap: 60px;
  margin: 0 auto;
  padding: 150px 0;
}

.campaign-copy blockquote {
  margin: 31px 0 23px;
  font-family: var(--serif-font);
  font-weight: 400;
  font-size: clamp(36px, 3.8vw, 55px);
  line-height: 1.05;
  letter-spacing: -0.045em;
}

.campaign-copy > p {
  max-width: 390px;
  margin: 0 0 29px;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.85;
}

.button-primary {
  display: inline-flex;
}

.campaign-image {
  position: relative;
  overflow: clip;
  border-radius: var(--radius-lg);

  img {
    width: 100%;
  }
}

.campaign-stamp {
  position: absolute;
  right: 19px;
  bottom: 18px;
  padding: 13px 15px 12px;
  color: #26384d;
  background: rgba(253, 252, 249, 0.92);
  font:
    400 25px/0.78 'DM Serif Display',
    Georgia,
    serif;
  text-align: center;
  transform: rotate(-6deg);
}

.campaign-stamp span {
  font:
    500 8px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.04em;
}

@media (width <= 900px) {
  .campaign-section {
    width: min(100% - 54px, 650px);
    grid-template-columns: 1fr;
    gap: 45px;
    padding: 100px 0;
  }
}

@media (width <= 490px) {
  .campaign-section {
    width: calc(100% - 40px);
  }

  .campaign-copy blockquote {
    font-size: 39px;
  }
}
</style>
