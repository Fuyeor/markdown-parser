<!-- @/home/component/hero.vue -->
<template>
  <section class="hero-section" :aria-labelledby="'hero-title'">
    <div class="hero-copy">
      <div class="eyebrow">
        <span aria-hidden="true">✦</span>Fuyeor Flavored Markdown
      </div>

      <!--<p class="hero-kicker">Fuyeor Flavored Markdown</p>-->

      <h1 id="hero-title">
        {{ t('home.hero.title.lead') }}<br /><em>{{
          t('home.hero.title.emphasis')
        }}</em>
      </h1>
      <p class="hero-description">{{ t('home.hero.description') }}</p>
      <div class="hero-actions">
        <router-link :to="{ name: 'Document' }" class="button-primary"
          >{{ t('home.hero.cta') }}
        </router-link>
        <!--<a class="button-quiet" href="#editorial"
          >{{ t('home.hero.learnMore') }} <span aria-hidden="true">›</span></a
        >-->
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { t } from '@fuyeor/vue-locale';
</script>

<style scoped>
.hero-section {
  position: relative;
  display: grid;
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
  font: 500 0.85rem monospace;
  letter-spacing: 0.02em;
}

/*
.hero-kicker {
  margin: 38px 0 15px;
  color: var(--ink-soft);
  font:
    500 11px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.12em;
}
*/

.hero-copy h1 {
  max-width: 640px;
  font:
    400 4rem 'DM Serif Display',
    Georgia,
    serif;
  margin: 40px 0;
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

/*
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
*/

.button-primary:active,
.button-quiet:active {
  transform: scale(0.97);
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
}
</style>
