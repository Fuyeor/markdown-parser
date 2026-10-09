<!-- @/option/view/general.vue -->
<template>
  <header-bar :title="t('option.general')" />

  <div class="option-layout">
    <p>
      {{ t('option.prefer.example') }} ({{ t('option.prefer.example.desc') }})
    </p>

    <!-- Theme Mode Selection -->
    <AppearanceSelector
      :active="appearanceState.theme"
      @select="appearanceState.setTheme"
    />

    <!-- Font Size Scaling -->
    <FontSizeSelector
      :active="appearanceState.fontSize"
      @select="appearanceState.setFontSize"
    />

    <!-- 节日气氛 -->
    <form-field class="checkbox-group" :tip="t('option.holidayMode.desc')">
      <label>
        <input
          type="checkbox"
          :checked="appearanceState.enableFlower"
          @change="
            (e: Event) =>
              appearanceState.setFlower((e.target as HTMLInputElement).checked)
          "
        />
        {{ t('option.holidayMode') }}
      </label>
    </form-field>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '@fuyeor/locale';
import {
  HeaderBar,
  FormField,
  AppearanceSelector,
  FontSizeSelector,
} from '@fuyeor/interactify';
import { useAppearanceState } from '@app/state/appearance';

const appearanceState = useAppearanceState();

const { t } = useLocale();
</script>
