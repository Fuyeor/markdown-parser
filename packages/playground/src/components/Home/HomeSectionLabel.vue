<!-- @/components/Home/HomeSectionLabel.vue -->
<template>
  <div class="section-label">
    <span>{{ number }}</span>
    <slot />
    <i v-if="syntax">{{ syntax }}</i>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  number: string;
  syntax?: string;
}>();
</script>

<style scoped>
.section-label {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink-soft);
  font:
    500 10px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.section-label::before {
  display: inline-block;
  width: 22px;
  height: 1px;
  margin-left: -33px;
  background: var(--lilac);
  content: '';
}

.section-label > span {
  color: var(--lilac-deep);
}

.section-label > i {
  color: var(--lilac-deep);
  font-style: normal;
  letter-spacing: 0.04em;
  opacity: 0.65;
}

@media (width <= 490px) {
  .section-label::before,
  .section-label > i {
    display: none;
  }
}
</style>
