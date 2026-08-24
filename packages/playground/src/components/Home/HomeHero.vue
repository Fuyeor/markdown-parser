<!-- @/components/Home/HomeHero.vue -->
<template>
  <section class="hero-section" :aria-labelledby="'hero-title'">
    <div class="hero-copy">
      <div class="eyebrow">
        <span aria-hidden="true">✦</span> {{ t('home.hero.eyebrow') }}
      </div>
      <p class="hero-kicker">{{ t('home.hero.kicker') }}</p>
      <h1 id="hero-title">
        {{ t('home.hero.titleLead') }}<br /><em>{{
          t('home.hero.titleEmphasis')
        }}</em>
      </h1>
      <p class="hero-description">{{ t('home.hero.description') }}</p>
      <div class="hero-actions">
        <router-link :to="playgroundLink" class="button-primary"
          >{{ t('home.hero.openPage') }}
          <span aria-hidden="true">↗</span></router-link
        >
        <a class="button-quiet" href="#editorial"
          >{{ t('home.hero.learnMore') }} <span aria-hidden="true">›</span></a
        >
      </div>
      <div class="hero-caption">
        <span>{{ t('home.hero.captionSentence') }}</span>
        <span class="caption-rule" aria-hidden="true" />
        <span>{{ t('home.hero.captionMargin') }}</span>
      </div>
    </div>
    <div class="hero-portrait-wrap">
      <div class="portrait-halo" aria-hidden="true" />
      <HomeImagePlaceholder
        class-name="hero-portrait"
        :label="t('home.hero.portraitPlaceholder')"
      />
      <div class="portrait-paper portrait-paper-top">
        <span aria-hidden="true">#</span> {{ t('home.hero.sampleTitle') }}
      </div>
      <div class="portrait-attribution">
        <span class="attribution-mark" aria-hidden="true">*</span>
        <span>{{ t('home.hero.attribution') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';
import HomeImagePlaceholder from './HomeImagePlaceholder.vue';
import { usePlaygroundLink } from '@/composables/usePlaygroundLink';

const { t } = useLocale();
const playgroundLink = usePlaygroundLink();
</script>

<style scoped>
.hero-section {
  position: relative;
  display: grid;
  width: min(1420px, calc(100% - 72px));
  min-height: 665px;
  grid-template-columns: 48% 52%;
  margin: 0 auto;
}

.hero-copy {
  position: relative;
  z-index: 4;
  align-self: center;
  padding: 76px 0 72px 85px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--lilac-deep);
  font:
    500 11px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.02em;
}

.hero-kicker {
  margin: 38px 0 15px;
  color: var(--ink-soft);
  font:
    500 11px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.12em;
}

.hero-copy h1 {
  max-width: 640px;
  margin: 0;
  font:
    400 clamp(57px, 5.5vw, 88px)/0.95 'DM Serif Display',
    Georgia,
    serif;
  letter-spacing: -0.057em;
}

.hero-copy h1 em {
  color: var(--lilac-deep);
  font-style: normal;
}

.hero-description {
  max-width: 455px;
  margin: 27px 0 29px;
  color: var(--ink-soft);
  font-size: 15px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 11px;
}

.button-primary,
.button-quiet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    transform 160ms var(--ease-out),
    background-color 180ms var(--ease-out),
    color 180ms var(--ease-out),
    border-color 180ms var(--ease-out);
}

.button-primary {
  position: relative;
  padding: 14px 18px;
  color: var(--ink);
  border-radius: 2px;
  background: var(--lilac);
  box-shadow: 3px 3px 0 rgba(36, 53, 75, 0.18);
  font-size: 12px;
  font-weight: 800;
}

.button-primary::before {
  color: rgba(36, 53, 75, 0.52);
  content: '#';
  font:
    500 10px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
}

.button-primary:hover {
  background: #c0b8ed;
  box-shadow: 5px 5px 0 rgba(36, 53, 75, 0.14);
  transform: translate(-1px, -2px);
}

.button-quiet {
  padding: 13px 12px;
  color: var(--ink);
  border-bottom: 1px solid var(--ink);
  font-size: 13px;
  font-weight: 800;
}

.button-quiet:hover {
  color: var(--lilac-deep);
  border-color: var(--lilac-deep);
  transform: translateY(-1px);
}

.button-primary:active,
.button-quiet:active {
  transform: scale(0.97);
}

.hero-caption {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 67px;
  color: var(--ink-soft);
  font:
    500 10px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.caption-rule {
  width: 31px;
  height: 1px;
  background: var(--lilac);
}

.hero-portrait-wrap {
  position: relative;
  min-height: 665px;
  margin-right: -18px;
  overflow: hidden;
}

.portrait-halo {
  position: absolute;
  z-index: 1;
  top: 13%;
  right: 6%;
  width: 70%;
  height: 69%;
  background: radial-gradient(
    circle,
    rgba(174, 164, 228, 0.45),
    rgba(174, 164, 228, 0) 69%
  );
  filter: blur(27px);
}

.hero-portrait {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  min-height: 665px;
}

.portrait-paper {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #24354b;
  border: 1px solid rgba(36, 53, 75, 0.1);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 34px rgba(39, 42, 68, 0.12);
  font:
    500 11px/1.4 'IBM Plex Mono',
    ui-monospace,
    monospace;
}

.portrait-paper-top {
  top: 31%;
  left: 3%;
  padding: 12px 14px;
  transform: rotate(-4deg);
}

.portrait-attribution {
  position: absolute;
  z-index: 4;
  right: 26px;
  bottom: 32px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  color: #24354b;
  background: rgba(252, 251, 248, 0.88);
  backdrop-filter: blur(6px);
  font-size: 12px;
  font-weight: 700;
}

.attribution-mark {
  color: var(--lilac-deep);
  font-size: 20px;
}

@media (width <= 900px) {
  .hero-section {
    width: min(100% - 36px, 700px);
    min-height: unset;
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 70px 12px 40px;
  }

  .hero-copy h1 {
    font-size: clamp(50px, 13vw, 71px);
  }

  .hero-portrait-wrap {
    min-height: 490px;
    margin: 0 -18px;
  }

  .hero-portrait {
    min-height: 490px;
  }
}

@media (width <= 490px) {
  .hero-section {
    width: calc(100% - 40px);
  }

  .hero-copy {
    padding-right: 4px;
    padding-left: 4px;
  }

  .hero-description {
    font-size: 14px;
  }

  .hero-actions {
    flex-wrap: wrap;
  }

  .portrait-paper-top {
    left: 10px;
  }
}
</style>
