<!-- @/option/general.vue -->
<template>
  <header-bar :title="t('option.general')" />

  <div class="option-layout">
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
    <form-field class="checkbox-group" :tip="t('mode.holiday.desc')">
      <label>
        <input
          type="checkbox"
          :checked="appearanceState.enableFlower"
          @change="
            (e: Event) =>
              appearanceState.setFlower((e.target as HTMLInputElement).checked)
          "
        />
        {{ t('mode.holiday') }}
      </label>
    </form-field>
  </div>
</template>

<script setup lang="ts">
import { t } from '@fuyeor/vue-locale';
import {
  HeaderBar,
  FormField,
  AppearanceSelector,
  FontSizeSelector,
} from '@fuyeor/interactify';
import { useAppearanceState } from '@app/state/appearance';

const appearanceState = useAppearanceState();
</script>
