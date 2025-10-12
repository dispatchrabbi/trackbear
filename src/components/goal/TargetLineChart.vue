<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Goal } from 'src/lib/api/goal.ts';

import { type SeriesInfoMap, type Tallyish } from '../chart/chart-functions.ts';
import { type TargetGoalParameters } from 'server/lib/models/goal/types.ts';
import ProgressChart from '../chart/ProgressChart.vue';
import type { SeriesTallyish } from '../chart/chart-functions.ts';

export type Goalish = Pick<Goal, 'title' | 'parameters' | 'startDate' | 'endDate'>;
const props = defineProps<{
  goal: Goalish;
  tallies: Tallyish[];
}>();

const measure = computed(() => (props.goal.parameters as TargetGoalParameters).threshold.measure);
const count = computed(() => (props.goal.parameters as TargetGoalParameters).threshold.count);

const seriesTallies = computed<SeriesTallyish[]>(() => {
  return props.tallies.map(tally => ({
    date: tally.date,
    count: tally.count,
    series: props.goal.title,
  }));
});

const seriesInfoMap = computed<SeriesInfoMap>(() => {
  return {
    [props.goal.title]: {
      uuid: props.goal.title,
      name: props.goal.title,
      color: '',
    },
  };
});

</script>

<template>
  <ProgressChart
    :tallies="seriesTallies"
    :measure-hint="measure"
    :series-info="seriesInfoMap"
    :start-date="goal.startDate"
    :end-date="goal.endDate"
    :goal-count="count"
    :show-legend="false"
    :graph-title="props.goal.title"
  />
</template>

<style scoped>
</style>
