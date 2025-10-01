<script setup lang="ts">
import { mapObject } from 'src/lib/obj';
import { toTitleCase } from 'src/lib/str';

import { USER_COLOR_NAMES, userColorLevel } from '../chart/user-colors';

import { useTheme } from 'src/lib/theme';
const { theme } = useTheme();

import Dropdown from 'primevue/dropdown';

const model = defineModel<string>({ required: true });
const props = withDefaults(defineProps<{
  idPrefix?: string;
  invalid?: boolean;
}>(), {
  idPrefix: 'form',
  invalid: false,
});

const colorOptionsMap = mapObject({
  '': { name: '', bg: 'bg-gradient-to-r from-indigo-500 to-amber-500' },
  ...Object.fromEntries(USER_COLOR_NAMES.map(name => ([name, { name, bg: `bg-${name}-${userColorLevel(theme.value)}` }]))),
}, (key, val) => ({
  label: toTitleCase(val.name || 'auto'),
  value: val.name,
  swatchClass: val.bg,
}));
</script>

<template>
  <Dropdown
    :id="`${props.idPrefix}-color`"
    v-model="model"
    :options="Object.values(colorOptionsMap)"
    option-value="value"
    :invalid="invalid"
  >
    <template #value="{value}">
      <div class="flex gap-2 items-center">
        <div
          :class="[
            'h-4 w-4',
            colorOptionsMap[value].swatchClass
          ]"
        />
        <div>{{ colorOptionsMap[value].label }}</div>
      </div>
    </template>
    <template #option="{option}">
      <div class="flex gap-2 items-center">
        <div
          :class="[
            'h-4 w-4',
            option.swatchClass
          ]"
        />
        <div>{{ option.label }}</div>
      </div>
    </template>
  </Dropdown>
</template>
