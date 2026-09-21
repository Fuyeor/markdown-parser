<!-- @/components/Home/HomeImagePlaceholder.vue -->
<template>
  <div
    class="image-placeholder"
    :class="className"
    role="img"
    :aria-label="label"
  >
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  className?: string;
  label: string;
}>();
</script>

<style scoped>
.image-placeholder {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100%;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(174, 164, 228, 0.62), transparent 45%),
    linear-gradient(32deg, #d7d2e9 0%, #f0eee8 49%, #b2bcc5 100%);
}

.image-placeholder::before,
.image-placeholder::after {
  position: absolute;
  display: block;
  content: '';
}

.image-placeholder::before {
  width: 47%;
  height: 112%;
  right: 9%;
  bottom: -12%;
  border-radius: 48% 48% 3% 3%;
  background: linear-gradient(
    160deg,
    rgba(36, 53, 75, 0.6),
    rgba(36, 53, 75, 0.12)
  );
  filter: blur(1px);
  transform: rotate(9deg);
}

.image-placeholder::after {
  inset: 0;
  background:
    radial-gradient(
      circle at 21% 20%,
      rgba(255, 255, 255, 0.64) 0 2px,
      transparent 3px
    ),
    radial-gradient(
      circle at 73% 31%,
      rgba(255, 255, 255, 0.5) 0 1px,
      transparent 2px
    ),
    linear-gradient(
      120deg,
      transparent 30%,
      rgba(255, 255, 255, 0.22) 31% 32%,
      transparent 33%
    );
  mix-blend-mode: screen;
}

.image-placeholder > span {
  position: relative;
  z-index: 1;
  padding: 7px 10px;
  color: rgba(36, 53, 75, 0.62);
  background: rgba(252, 251, 247, 0.55);
  font:
    500 10px/1 'IBM Plex Mono',
    ui-monospace,
    monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
