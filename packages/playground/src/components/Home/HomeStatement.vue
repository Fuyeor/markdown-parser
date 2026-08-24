<!-- @/components/Home/HomeStatement.vue -->
<template>
  <section class="statement-section">
    <HomeSectionLabel number="02" syntax="# > **"
      >A small system for real thoughts</HomeSectionLabel
    >
    <div class="statement-grid">
      <div class="statement-main">
        <p class="statement-overline">Readable by default</p>
        <h2>每一个符号，<br />都有它的<strong>呼吸位置。</strong></h2>
      </div>
      <div class="statement-side">
        <p>
          FFM 将熟悉的 Markdown
          语法，放进一套更注重层级、节奏与预览反馈的体验里。你不需要学习新语言，只需要继续写下去。
        </p>
        <router-link :to="playgroundLink"
          >探索写作节奏 <span aria-hidden="true">↗</span></router-link
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import HomeSectionLabel from './HomeSectionLabel.vue';
import { usePlaygroundLink } from '@/composables/usePlaygroundLink';

const playgroundLink = usePlaygroundLink();
</script>

<style scoped>
.statement-section {
  width: min(1128px, calc(100% - 150px));
  margin: 0 auto;
  padding: 155px 0 132px;
}

.statement-grid {
  display: grid;
  grid-template-columns: 1.36fr 0.64fr;
  align-items: end;
  column-gap: 110px;
  margin-top: 39px;
}

.statement-overline {
  margin: 0 0 20px;
  color: var(--lilac-deep);
  font:
    500 11px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
}

.statement-main h2 {
  margin: 0;
  font:
    400 clamp(45px, 4.5vw, 69px)/0.95 'DM Serif Display',
    Georgia,
    serif;
  letter-spacing: -0.057em;
}

.statement-main strong {
  color: var(--lilac-deep);
  font-weight: 400;
}

.statement-side {
  padding-bottom: 6px;
}

.statement-side p {
  margin: 0 0 26px;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.9;
}

.statement-side a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--lilac);
  font-size: 13px;
  font-weight: 800;
}

.statement-side a:hover {
  color: var(--lilac-deep);
}

@media (width <= 900px) {
  .statement-section {
    width: min(100% - 54px, 650px);
    padding: 100px 0;
  }

  .statement-grid {
    grid-template-columns: 1fr;
    gap: 37px;
  }

  .statement-main h2 {
    font-size: 54px;
  }
}

@media (width <= 490px) {
  .statement-section {
    width: calc(100% - 40px);
  }
}
</style>
