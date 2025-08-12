<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Goal } from 'src/lib/api/goal.ts';

import { Tallyish } from '../chart/chart-functions.ts';
import { TargetGoalParameters } from 'server/lib/models/goal/types.ts';
import ProgressChart, { SeriesTallyish } from '../chart/ProgressChart.vue';

export type Goalish = Pick<Goal, 'title' | 'parameters' | 'startDate' | 'endDate'>;
const props = defineProps<{
  goal: Goalish;
  tallies: Tallyish[];
}>();

const measure = computed(() => (props.goal.parameters as TargetGoalParameters).threshold.measure);

const seriesTallies = computed<SeriesTallyish[]>(() => {
  return props.tallies.map(tally => ({
    date: tally.date,
    count: tally.count,
    series: props.goal.title,
  }));
});

</script>

<template>
  <ProgressChart
    :tallies="seriesTallies"
    :measure-hint="measure"
    :start-date="goal.startDate"
    :end-date="goal.endDate"
    :goal-count="goal.parameters.threshold.count"
    :show-legend="false"
    :graph-title="props.goal.title"
  />
</template>

<style scoped>
</style>
