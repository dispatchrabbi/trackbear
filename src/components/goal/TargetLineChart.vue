<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Goal } from 'src/lib/api/goal.ts';
import type { Tally } from 'src/lib/api/tally.ts';

import { kify } from 'src/lib/number.ts';
import { formatDuration } from "src/lib/date.ts";
import { formatCount } from 'src/lib/tally.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import { normalizeTallies, accumulateTallies, listEachDayOfData } from '../chart/chart-functions.ts';
import LineChart from 'src/components/chart/LineChart.vue';
import type { LineChartOptions } from 'src/components/chart/LineChart.vue';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';
import { GoalTargetParameters } from 'server/lib/models/goal.ts';

const props = defineProps<{
  goal: Goal;
  tallies: Tally[];
}>();

const measure = computed(() => (props.goal.parameters as GoalTargetParameters).threshold.measure);

const chartData = computed(() => {
  const normalizedTallies = normalizeTallies(props.tallies);
  const eachDay = listEachDayOfData(props.goal.startDate, props.goal.endDate, normalizedTallies[0].date, normalizedTallies[normalizedTallies.length - 1].date);

  const tallyDataset = {
    label: props.goal.title,
    data: accumulateTallies(normalizedTallies),
  };

  const goalCount = (props.goal.parameters as GoalTargetParameters).threshold.count;
  const parDataset = {
    label: 'Par',
    data: props.goal.endDate === null ?
      eachDay.map(date => ({ date, count: goalCount })) :
      eachDay.map((date, ix) => ({
        date,
        value: (ix === eachDay.length - 1) ? goalCount : Math.ceil((goalCount / eachDay.length) * (ix + 1)),
      })),
    pointRadius: 0,
    borderDash: [8],
  };

  const data = {
    labels: eachDay,
    datasets: [
      tallyDataset,
      parDataset
    ],
  };

  return data;
});

const chartOptions = computed(() => {
  const parsing = {
    xAxisKey: 'date',
    yAxisKey: 'value',
  };

  const scales = {
    y: {
      type: 'linear',
      suggestedMin: 0,
      suggestedMax: TALLY_MEASURE_INFO[measure.value].defaultChartMax,
      ticks: {
        callback: val => measure.value === TALLY_MEASURE.TIME ? formatDuration(val, true) : kify(val),
        stepSize: measure.value === TALLY_MEASURE.TIME ? 60 : undefined,
      }
    }
  };

  const legend = {
    display: chartData.value.datasets.length > 1,
    position: 'bottom',
  };

  const tooltip = {
    callbacks: {
      label: ctx => formatCount(ctx.raw.value, measure.value),
    },
  };

  const options = {
    parsing,
    scales,
    plugins: {
      legend,
      tooltip,
    },
  };

  return options as LineChartOptions;
});

</script>

<template>
  <!-- @vue-expect-error chartData won't ever be exactly the right type, due to ChartJS being highly configurable -->
  <LineChart
    :data="chartData"
    :options="chartOptions"
  />
</template>

<style scoped>
</style>
