<!-- @/option/view/editor.vue -->
<template>
  <header-bar :title="t('option.editor')" />

  <div class="option-layout">
    <!-- continuous script (e.g. en, fr, es) -->
    <form-section :title="t('editor.format.continuous')">
      <form-field>
        <input type="checkbox" v-model="state.continuousScript.autoSpacing" />
        {{ t('editor.format.continuous.autoSpacing') }}
      </form-field>
      <form-field>
        <input type="checkbox" v-model="state.continuousScript.autoUpperWord" />
        {{ t('editor.format.continuous.autoUpperWord') }}
      </form-field>
      <form-field>
        <input
          type="checkbox"
          v-model="state.continuousScript.fullwidthPunctuation"
        />
        {{ t('editor.format.continuous.fullwidth') }}
      </form-field>
    </form-section>

    <!-- western script (e.g. zh, ja, th) -->
    <form-section :title="t('editor.format.groupAutoCase')">
      <form-field>
        <input v-model="state.autoCase.sentence" type="checkbox" />
        {{ t('editor.format.sentence') }}
      </form-field>

      <form-field :label="t('editor.format.heading')">
        <select-box
          class="select-option"
          v-model="state.autoCase.heading"
          :options="headingOption"
        />
      </form-field>
    </form-section>

    <!-- custom glossary and rule -->
    <form-section :title="t('editor.format.custom')">
      <form-field :label="t('editor.format.glossary')">
        <div class="hellow">
          <div
            v-for="(item, index) in state.autoCase.glossary"
            :key="index"
            class="option-row"
          >
            <input v-model="item.from" :placeholder="t('editor.format.from')" />
            <span class="arrow">→</span>
            <input v-model="item.to" :placeholder="t('editor.format.to')" />
            <button
              type="button"
              class="remove-btn"
              @click="removeGlossary(index)"
            >
              ×
            </button>
          </div>
        </div>

        <button type="button" class="option-btn" @click="addGlossary">
          + {{ t('editor.format.custom.add') }}
        </button>
      </form-field>

      <form-field :label="t('editor.replacer')">
        <div class="hellow">
          <div
            v-for="(rule, index) in state.replacer"
            :key="index"
            class="option-row"
          >
            <input
              v-model="rule.from"
              :placeholder="t('editor.format.pattern')"
            />
            <span class="arrow">→</span>
            <input
              v-model="rule.to"
              :placeholder="t('editor.format.replacement')"
            />
            <label class="regex">
              <input v-model="rule.regex" type="checkbox" />
              RegExp
            </label>
            <button
              type="button"
              class="remove-btn"
              @click="removeReplacer(index)"
            >
              ×
            </button>
          </div>
        </div>

        <button type="button" class="option-btn" @click="addReplacer">
          + {{ t('editor.format.custom.add') }}
        </button>
      </form-field>
    </form-section>

    <!-- reset option -->
    <button type="button" class="reset" @click="reset">
      {{ t('editor.format.reset') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from '@fuyeor/locale';
import {
  HeaderBar,
  FormField,
  FormSection,
  SelectBox,
} from '@fuyeor/interactify';
import {
  defaultOption,
  useFormatOption,
} from '@/playground/composable/useFormatOption';

const { t } = useLocale();
const state = useFormatOption();

const headingOption = computed(() => [
  { value: null, label: t('editor.format.headingCaseOff') },
  { value: 'sentence', label: t('editor.format.heading.sentence') },
  { value: 'title', label: t('editor.format.heading.title') },
  { value: 'capitalize', label: t('editor.format.heading.capitalize') },
]);

const addGlossary = () =>
  state.value.autoCase.glossary.push({ from: '', to: '' });
const removeGlossary = (i: number) =>
  state.value.autoCase.glossary.splice(i, 1);

const addReplacer = () => state.value.replacer.push({ from: '', to: '' });
const removeReplacer = (i: number) => state.value.replacer.splice(i, 1);

const reset = () => {
  state.value = defaultOption;
};
</script>

<style scoped>
.hellow {
  display: flex;
  gap: 1rem;
  flex-direction: column;
  padding: 10px 0 20px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;

  input[type='text'],
  input:not([type]) {
    flex: 1;
    min-width: 0;
  }

  .regex {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
  }
}

.arrow {
  color: var(--text-secondary);
}

.reset {
  align-self: center;
  color: var(--text-danger, #e53e3e);
}
</style>
