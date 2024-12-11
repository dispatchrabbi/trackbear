<script setup lang="ts">
import { computed, defineProps } from 'vue';
import themeColors from 'src/themes/primevue.ts';

import { useTheme } from 'src/lib/theme';

import { formatCount } from 'src/lib/tally.ts';

import MeterGroup, { MeterItem } from 'primevue/metergroup';

const props = defineProps<{
  past: number;
  today: number;
  goal: number;
  measure: string;
}>();

const meterStats = computed(() => {
  const preferredColorScheme = useTheme().theme.value;

  const isComplete = props.past + props.today >= props.goal;
  const pastColor = isComplete ? themeColors.accent : themeColors.surface;
  const colors = {
    past: preferredColorScheme === 'dark' ? pastColor[400] : pastColor[500],
    today: preferredColorScheme === 'dark' ? themeColors.primary[400] : themeColors.primary[500],
  }

  return {
    values: [
      { label: 'Past Progress', color: colors.past, value: props.past },
      { label: 'Today', color: colors.today, value: props.today },
    ] as MeterItem[],
  };
});
</script>

<template>
  <MeterGroup
    :value="meterStats.values"
    :max="Math.max(props.goal, props.today + props.past)"
  >
    <template #start="{ totalPercent }">
      <div class="flex justify-between relative h-2">
        <span
          :style="{ width: totalPercent + '%' }"
          class="absolute text-right"
        >
          {{ totalPercent }}%
        </span>
      </div>
    </template>
    <template #label="{ value }">
      <!-- there's no easy way to just change the given value in the legend, so we have to recreate the whole thing -->
      <ol
        class="flex flex-wrap gap-4 align-end m-0 p-0 list-none"
        data-pc-section="labellist"
      >
        <li
          v-for="val of value"
          :key="val.label"
          class="inline-flex items-center gap-2"
          data-pc-section="labellistitem"
        >
          <span
            class="inline-flex bg-primary-500 dark:bg-primary-400 w-2 h-2 rounded-full"
            :style="{ backgroundColor: val.color }"
            data-pc-section="labellisttype"
          />
          <span
            class=""
            data-pc-section="label"
          >
            {{ val.label }} ({{ formatCount(val.value, props.measure) }})
          </span>
        </li>
      </ol>
    </template>
  </MeterGroup>
</template>
