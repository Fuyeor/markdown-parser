<!-- @/components/Home/HomeCampaign.vue -->
<template>
  <section id="notes" class="campaign-section">
    <div class="campaign-copy">
      <HomeSectionLabel number="05"
        >A word from the ambassador</HomeSectionLabel
      >
      <blockquote>
        “当你不再需要思考工具该怎么用时，你才能听见自己脑海里的声音。”
      </blockquote>
      <p>
        FFM
        的设计初衷，是让每一次换行、每一个加粗，都成为写作节奏的一部分，而不是干扰。
      </p>
      <router-link :to="playgroundLink" class="button-primary"
        >开始你的第一页 <span aria-hidden="true">↗</span></router-link
      >
    </div>
    <div class="campaign-image">
      <HomeImagePlaceholder
        class-name="campaign-main-img"
        label="Campaign image placeholder"
      />
      <div class="campaign-stamp">FFM<br /><span>2026</span></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import HomeImagePlaceholder from './HomeImagePlaceholder.vue';
import HomeSectionLabel from './HomeSectionLabel.vue';
import { usePlaygroundLink } from '@/composables/usePlaygroundLink';

const playgroundLink = usePlaygroundLink();
</script>

<style scoped>
.campaign-section {
  display: grid;
  width: min(1128px, calc(100% - 150px));
  grid-template-columns: 0.95fr 1.05fr;
  align-items: center;
  gap: 108px;
  margin: 0 auto;
  padding: 150px 0;
}

.campaign-copy blockquote {
  margin: 31px 0 23px;
  font:
    400 clamp(36px, 3.8vw, 55px)/1.05 'DM Serif Display',
    Georgia,
    serif;
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
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 18px;
  color: var(--ink);
  border-radius: 2px;
  background: var(--lilac);
  box-shadow: 3px 3px 0 rgba(36, 53, 75, 0.18);
  font-size: 12px;
  font-weight: 800;
  transition:
    transform 160ms var(--ease-out),
    background-color 180ms var(--ease-out),
    box-shadow 180ms var(--ease-out);
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

.button-primary:active {
  transform: scale(0.97);
}

.campaign-image {
  position: relative;
  height: 523px;
  overflow: hidden;
}

.campaign-main-img {
  width: 100%;
  height: 100%;
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

  .campaign-image {
    height: 495px;
  }
}

@media (width <= 490px) {
  .campaign-section {
    width: calc(100% - 40px);
  }

  .campaign-copy blockquote {
    font-size: 39px;
  }

  .campaign-image {
    height: 440px;
  }
}
</style>
