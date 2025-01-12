<script setup lang="ts">
import { computed, defineProps } from 'vue';

import type { Goal } from 'src/lib/api/goal.ts';
import type { HabitGoalParameters } from 'server/lib/models/goal/types';
import type { HabitRange } from 'server/lib/models/goal/consts';
import { formatDateRange } from 'src/lib/date.ts';
import { formatCount } from 'src/lib/tally';

import FullCircleGauge from '../stats/FullCircleGauge.vue';

type Goalish = Pick<Goal, 'title' | 'parameters'>;
const props = defineProps<{
  goal: Goalish;
  range: HabitRange;
  highlight?: boolean;
}>();

const max = computed(() => {
  const params = props.goal.parameters as HabitGoalParameters;
  return params.threshold?.count ?? 1;
});

const text = computed(() => {
  const params = props.goal.parameters as HabitGoalParameters;
  if(params.threshold === null) {
    return `${props.range.tallies.length} time${props.range.tallies.length === 1 ? '' : 's'}`;
  } else {
    return formatCount(props.range.total, params.threshold.measure);
  }
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
      <div class="w-24 h-24">
        <FullCircleGauge
          :max="max"
          :value="props.range.total"
          :text="text"
        />
      </div>
    </div>
    <div class="whitespace-nowrap">
      {{ formatDateRange(range.startDate, range.endDate, 'MMM d') }}
    </div>
  </div>
</template>
