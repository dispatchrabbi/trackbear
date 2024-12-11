<script setup lang="ts">
import { useTheme, THEME_OPTIONS } from 'src/lib/theme.ts';
const { rawTheme } = useTheme();

import SelectButton from 'primevue/selectbutton';

</script>

<template>
  <SelectButton
    id="theme-form-theme"
    v-model="rawTheme"
    :options="THEME_OPTIONS"
    option-label="label"
    option-value="value"
  >
    <template #option="slotProps">
      <div class="flex gap-2">
        <i :class="slotProps.option.icon" />
        <div>{{ slotProps.option.label }}</div>
      </div>
    </template>
  </SelectButton>
</template>