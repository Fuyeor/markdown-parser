<!-- @/playground/component/copy-clipboard.vue -->
<template>
  <div class="form-group copy-clipboard">
    <!-- Component Label -->
    <label v-if="label">{{ label }}</label>

    <!-- Optional Description -->
    <p v-if="description" class="form-group-description">{{ description }}</p>

    <div class="input-with-action">
      <!-- Display Input: Shows dots if secret and not revealed -->
      <input type="text" :value="displayValue" readonly />

      <!-- Show/Hide Button for Secrets -->
      <button
        v-if="isSecret"
        v-ripple
        type="button"
        class="action-btn primary"
        @click="toggleReveal"
      >
        {{ isRevealed ? t('hide') : t('show') }}
      </button>

      <!-- Copy Button -->
      <button
        v-ripple
        type="button"
        class="action-btn primary"
        @click="copyText(value)"
      >
        {{ t('copy') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLocale } from '@fuyeor/locale';
import { useCopy } from '@fuyeor/interactify';

const props = withDefaults(
  defineProps<{
    // The main title for the field
    label?: string;
    // Optional small text description below the label
    description?: string;
    // The actual value to be displayed and copied
    value: string;
    // If true, the value is treated as a secret (masked by default)
    isSecret?: boolean;
  }>(),
  {
    isSecret: false,
  },
);

const { t } = useLocale();
const { copyText } = useCopy();

const isRevealed = ref(false);

// Toggles the visibility of the secret
const toggleReveal = () => {
  isRevealed.value = !isRevealed.value;
};

// Determines what to show in the input field
const displayValue = computed(() => {
  if (props.isSecret && !isRevealed.value) {
    return '••••••••••••••••••••'; // Mask for secrets
  }
  return props.value;
});
</script>

<style>
.input-with-action {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.input-with-action input {
  flex-grow: 1;
}
.input-with-action button {
  font-weight: 700;
  white-space: nowrap;
}
</style>
