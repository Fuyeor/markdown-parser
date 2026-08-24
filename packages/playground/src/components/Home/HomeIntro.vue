<!-- @/components/Home/HomeIntro.vue -->
<template>
  <section id="editorial" class="intro-strip" aria-label="FFM 理念">
    <p>不是更复杂的编辑器，而是<strong>更轻松的写作状态。</strong></p>
    <span>↓ one mark at a time</span>
  </section>
</template>

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
