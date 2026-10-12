<!-- @/document/component/toolbar/replacer.vue -->
<template>
  <div class="search-panel">
    <div class="row">
      <input
        ref="queryRef"
        v-model="query"
        class="field"
        type="text"
        :placeholder="t('editor.replacer.from')"
        @keydown.enter.prevent="onEnter"
        @keydown.escape.prevent="emit('close')"
      />
      <span class="counter">{{
        total ? `${active + 1}/${total}` : '0/0'
      }}</span>
      <button type="button" :disabled="!total" @click="prev">↑</button>
      <button type="button" :disabled="!total" @click="next">↓</button>
      <button type="button" :aria-label="t('close')" @click="emit('close')">
        ×
      </button>
    </div>

    <div class="row">
      <input
        v-model="replacement"
        class="field"
        type="text"
        :placeholder="t('editor.replacer.to')"
      />
      <button type="button" :disabled="!total" @click="onReplaceOne">
        {{ t('editor.replacer.replaceOne') }}
      </button>
      <button type="button" :disabled="!total" @click="onReplaceAll">
        {{ t('editor.replacer.replaceAll') }}
      </button>
    </div>

    <div class="row option">
      <label>
        <input v-model="option.caseSensitive" type="checkbox" />
        {{ t('editor.replacer.caseSensitive') }}
      </label>
      <label>
        <input v-model="option.regex" type="checkbox" />
        {{ t('editor.replacer.regex') }}
      </label>
      <label>
        <input v-model="option.wholeWord" type="checkbox" />
        {{ t('editor.replacer.wholeWord') }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useSearchReplace } from '@/document/composable/useReplacer';

const props = defineProps<{ source: string }>();

const emit = defineEmits<{
  (event: 'replace', value: string): void;
  (event: 'highlight', start: number, end: number): void;
  (event: 'close'): void;
}>();

const { t } = useLocale();
const queryRef = ref<HTMLInputElement | null>(null);

const {
  query,
  replacement,
  active,
  option,
  current,
  total,
  next,
  prev,
  replaceOne,
  replaceAll,
} = useSearchReplace(() => props.source);

// Follow the active match to let the textarea scroll & select.
watch(current, (m) => {
  if (m) emit('highlight', m.start, m.end);
});

const onEnter = (event: KeyboardEvent) => {
  if (event.shiftKey) prev();
  else next();
};

const onReplaceOne = () => {
  const result = replaceOne();
  if (result !== null) emit('replace', result);
};

const onReplaceAll = () => {
  const result = replaceAll();
  if (result !== null) emit('replace', result);
};

onMounted(() => queryRef.value?.focus());
</script>

<style scoped>
.search-panel {
  position: absolute;
  top: 8px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 12px;
  border-radius: var(--radius-lg);
  background-color: var(--surface-raised);
  box-shadow: 0 2px 12px rgb(0 0 0 / 15%);
}

.row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.field {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 10px;
  background-color: var(--surface-top);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
}

.counter {
  min-width: 36px;
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.row button {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: 4px;
  background-color: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.row button:hover:not(:disabled) {
  background-color: var(--surface-top-hover);
}

.row button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.option {
  color: var(--text-secondary);
  font-size: 12px;
}

.option label {
  display: flex;
  align-items: center;
  gap: 2px;
}

@media (width < 768px) {
  .search-panel {
    position: fixed;
    inset: auto 0 0 0;
    gap: 8px;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -2px 16px rgb(0 0 0 / 18%);
  }

  .field {
    height: 36px;
    padding: 0 10px;
    font-size: 16px;
  }

  .row button {
    min-width: 36px;
    height: 36px;
    padding: 0 10px;
    font-size: 14px;
  }

  .counter {
    min-width: 32px;
    font-size: 13px;
  }

  .option {
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 13px;
  }

  .option label {
    padding: 4px 0;
  }
}
</style>
