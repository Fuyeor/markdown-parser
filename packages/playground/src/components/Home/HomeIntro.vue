<!-- @/components/Home/HomeIntro.vue -->
<template>
  <section
    id="editorial"
    class="intro-strip"
    :aria-label="t('home.intro.ariaLabel')"
  >
    <p>
      {{ t('home.intro.lead') }}<strong>{{ t('home.intro.emphasis') }}</strong>
    </p>
    <span>{{ t('home.intro.caption') }}</span>
  </section>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';

const { t } = useLocale();
</script>

<style scoped>
.intro-strip {
  display: flex;
  width: min(1248px, calc(100% - 150px));
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0 auto;
  padding: 23px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.intro-strip p {
  margin: 0;
  font:
    400 27px/1.2 'DM Serif Display',
    Georgia,
    serif;
  letter-spacing: -0.025em;
}

.intro-strip strong {
  color: var(--lilac-deep);
  font-weight: 400;
}

.intro-strip > span {
  color: var(--ink-soft);
  font:
    500 10px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (width <= 900px) {
  .intro-strip {
    width: min(100% - 54px, 650px);
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (width <= 490px) {
  .intro-strip {
    width: calc(100% - 40px);
  }
}
</style>
