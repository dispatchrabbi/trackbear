<script setup lang="ts">
import { computed, defineProps } from 'vue';

import type { Goal } from 'src/lib/api/goal.ts';
import type { GoalHabitParameters } from 'server/lib/models/goal.ts';
import type { HabitRange } from 'src/lib/goal.ts';
import { formatDateRange } from 'src/lib/date.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';

import Knob from 'primevue/knob';
const props = defineProps<{
  goal: Goal;
  range: HabitRange;
  highlight?: boolean;
}>();

// We need to work around the fact that Knob won't (yet) let us format the label
// see https://github.com/primefaces/primevue/pull/5569
const total = computed(() => {
  const params = props.goal.parameters as GoalHabitParameters;
  if(params.threshold && params.threshold.measure === TALLY_MEASURE.TIME) {
    return parseFloat((props.range.total / 60).toFixed(2));
  } else {
    return props.range.total;
  }
});
const max = computed(() => {
  const params = props.goal.parameters as GoalHabitParameters;
  const count = params.threshold === null ? -Infinity :  params.threshold.measure === TALLY_MEASURE.TIME ? parseFloat((params.threshold.count / 60).toFixed(2)) : params.threshold.count;
  return Math.max(
    count,
    total.value,
  );
});
</script>

<template>
  <div
    :class="[
      'flex flex-col items-center p-2 m-1 rounded-lg',
      { 'bg-surface-200 dark:bg-surface-700': props.highlight },
    ]"
  >
    <div>
      <Knob
        v-model="total"
        :min="0"
        :max="max"
        readonly
        :pt="{
          value: { class: { '!stroke-accent-400 dark:!stroke-accent-500': total >= max } },
          range: { class: { '!stroke-surface-400 dark:!stroke-surface-500': highlight }}
        }"
        :pt-options="{ mergeProps: true, mergeSections: true }"
      />
    </div>
    <div class="whitespace-nowrap">
      {{ formatDateRange(range.startDate, range.endDate, 'MMM d') }}
    </div>
  </div>
</template>
