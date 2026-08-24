<!-- @/components/Home/HomeFooter.vue -->
<template>
  <footer class="site-footer" :aria-label="t('home.footer.ariaLabel')">
    <div class="footer-brand">
      <span class="editorial-wordmark"
        ><b>fuyeor</b><i>flavored markdown</i></span
      >
    </div>
    <p>{{ t('home.footer.copyright') }}</p>
    <div class="footer-links">
      <a href="#">{{ t('home.footer.terms') }}</a>
      <a href="#">{{ t('home.footer.privacy') }}</a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';

const { t } = useLocale();
</script>

<style scoped>
.site-footer {
  display: flex;
  width: min(1420px, calc(100% - 72px));
  align-items: center;
  gap: 26px;
  margin: 0 auto;
  padding: 27px 0 35px;
  border-top: 1px solid var(--line);
}

.editorial-wordmark {
  display: grid;
  gap: 0;
  color: var(--ink);
  line-height: 0.75;
}

.editorial-wordmark b {
  font:
    400 22px/1 'DM Serif Display',
    Georgia,
    serif;
  letter-spacing: -0.07em;
}

.editorial-wordmark i {
  color: var(--lilac-deep);
  font:
    500 6px/1.15 'IBM Plex Mono',
    ui-monospace,
    monospace;
  font-style: normal;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.site-footer > p {
  flex: 1;
  margin: 0;
  color: var(--ink-soft);
  font:
    500 11px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
}

.footer-links {
  display: flex;
  gap: 20px;
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 700;
}

.footer-links a:hover {
  color: var(--lilac-deep);
}

@media (width <= 900px) {
  .site-footer {
    width: min(100% - 36px, 700px);
    flex-wrap: wrap;
  }

  .site-footer > p {
    order: 3;
    width: 100%;
    flex-basis: 100%;
    margin-top: 4px;
  }
}

@media (width <= 490px) {
  .site-footer {
    width: calc(100% - 32px);
  }
}
</style>
