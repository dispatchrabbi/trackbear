<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Goal } from 'src/lib/api/goal.ts';

import { normalizeTallies, accumulateTallies, listEachDayOfData, Tallyish } from '../chart/chart-functions.ts';
import { TargetGoalParameters } from 'server/lib/models/goal/types.ts';
import LineChart from '../chart/LineChart.vue';

export type Goalish = Pick<Goal, 'title' | 'parameters' | 'startDate' | 'endDate'>;
const props = defineProps<{
  goal: Goalish;
  tallies: Tallyish[];
}>();

const measure = computed(() => (props.goal.parameters as TargetGoalParameters).threshold.measure);

const data = computed(() => {
  // first we'll figure out the user's progress
  const normalizedTallies = normalizeTallies(props.tallies);
  const accumulatedTallies = accumulateTallies(normalizedTallies);

  const progressData = accumulatedTallies.map(tally => ({
    series: props.goal.title,
    date: tally.date,
    value: tally.accumulated,
  }));

  // now we'll calculate par
  const eachDay = listEachDayOfData(props.goal.startDate, props.goal.endDate, normalizedTallies[0].date, normalizedTallies[normalizedTallies.length - 1].date);
  const goalCount = (props.goal.parameters as TargetGoalParameters).threshold.count;
  const parData = eachDay.map((date, ix) => ({
    series: 'Par',
    date,
    value: props.goal.endDate === null ? goalCount : (ix === eachDay.length - 1) ? goalCount : Math.ceil((goalCount / eachDay.length) * (ix + 1)),
  }));

  return {
    progress: progressData,
    par: parData,
  };
});

</script>

<template>
  <LineChart
    :data="data.progress"
    :par="data.par"
    :measure-hint="measure"
    :show-legend="false"
  />
</template>

<style scoped>
</style>
