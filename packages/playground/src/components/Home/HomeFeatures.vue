<!-- @/components/Home/HomeFeatures.vue -->
<template>
  <section
    id="features"
    class="feature-section"
    aria-labelledby="feature-title"
  >
    <div class="feature-image-block">
      <HomeImagePlaceholder
        class-name="feature-main-img"
        :label="t('home.features.imagePlaceholder')"
      />
      <div class="feature-image-label">
        <span>{{ t('home.features.imageCaption') }}</span>
        <strong>{{ t('home.features.imageTitle') }}</strong>
      </div>
    </div>
    <div class="feature-list-wrap">
      <HomeSectionLabel number="04">{{
        t('home.features.label')
      }}</HomeSectionLabel>
      <h2 id="feature-title">
        {{ t('home.features.titleLead') }}<br /><em>{{
          t('home.features.titleEmphasis')
        }}</em>
      </h2>
      <div class="feature-list">
        <div
          v-for="feature in features"
          :key="feature.index"
          class="feature-row"
        >
          <span class="feature-index">{{ feature.index }}</span>
          <div>
            <h3>{{ t(feature.titleKey) }}</h3>
            <p>{{ t(feature.descriptionKey) }}</p>
          </div>
          <span class="feature-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';
import HomeImagePlaceholder from './HomeImagePlaceholder.vue';
import HomeSectionLabel from './HomeSectionLabel.vue';

const { t } = useLocale();

const features = [
  {
    index: '01',
    titleKey: 'home.features.items.format.title',
    descriptionKey: 'home.features.items.format.description',
  },
  {
    index: '02',
    titleKey: 'home.features.items.preview.title',
    descriptionKey: 'home.features.items.preview.description',
  },
  {
    index: '03',
    titleKey: 'home.features.items.output.title',
    descriptionKey: 'home.features.items.output.description',
  },
];
</script>

<style scoped>
.feature-section {
  display: grid;
  width: min(1340px, calc(100% - 72px));
  grid-template-columns: 48% 52%;
  margin: 0 auto;
  background: var(--paper-deep);
}

.feature-image-block {
  position: relative;
  min-height: 625px;
  overflow: hidden;
}

.feature-main-img {
  position: absolute;
  inset: 0;
}

.feature-image-label {
  position: absolute;
  bottom: 30px;
  left: 30px;
  display: grid;
  gap: 6px;
  color: #fff;
}

.feature-image-label span {
  font:
    500 10px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.82;
}

.feature-image-label strong {
  font:
    400 28px/1.1 'DM Serif Display',
    Georgia,
    serif;
}

.feature-list-wrap {
  padding: 74px 71px 52px;
}

.feature-list-wrap h2 {
  margin: 28px 0 41px;
  font:
    400 clamp(43px, 4vw, 60px)/0.95 'DM Serif Display',
    Georgia,
    serif;
  letter-spacing: -0.057em;
}

.feature-list-wrap h2 em {
  color: var(--lilac-deep);
  font-style: normal;
}

.feature-list {
  border-top: 1px solid var(--line);
}

.feature-row {
  display: grid;
  grid-template-columns: 42px 1fr 18px;
  gap: 15px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
  transition:
    padding-left 180ms var(--ease-out),
    background 180ms var(--ease-out);
}

.feature-row:hover {
  padding-left: 9px;
  background: rgba(174, 164, 228, 0.07);
}

.feature-index {
  color: var(--lilac-deep);
  font:
    500 10px/1.5 'IBM Plex Mono',
    ui-monospace,
    monospace;
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

.feature-arrow {
  margin-top: 2px;
  color: var(--lilac-deep);
}

@media (width <= 900px) {
  .feature-section {
    width: min(100% - 36px, 700px);
    grid-template-columns: 1fr;
  }

  .feature-image-block {
    min-height: 430px;
  }

  .feature-list-wrap {
    padding: 57px 34px 40px;
  }
}

@media (width <= 490px) {
  .feature-section {
    width: calc(100% - 32px);
  }
}
</style>
