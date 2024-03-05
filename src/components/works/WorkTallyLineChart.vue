<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Work } from 'src/lib/api/work.ts';
import type { Tally } from 'src/lib/api/tally.ts';
import type { Tag } from 'src/lib/api/tag.ts';

import { kify } from 'src/lib/number.ts';
import { formatCount } from 'src/lib/tally.ts';
import { TALLY_MEASURE } from 'server/lib/entities/tally';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import { normalizeTallies, accumulateTallies } from '../chart/chart-functions';
import LineChart from 'src/components/chart/LineChart.vue';
import type { LineChartOptions } from 'src/components/chart/LineChart.vue';

const props = defineProps<{
  work: Work;
  tallies: Array<Tally & { tags: Tag[] }>;
}>();

// TODO: expand graph beyond words
const TEMP_GRAPH_TALLIES = computed(() => props.tallies.filter(tally => tally.measure === TALLY_MEASURE.WORD));

const chartData = computed(() => {
  const data = {
    labels: TEMP_GRAPH_TALLIES.value.map(tally => tally.date),
    datasets: [{
      label: props.work.title,
      measure: TALLY_MEASURE.WORD,
      data:accumulateTallies(normalizeTallies(TEMP_GRAPH_TALLIES.value)),
    }],
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
      suggestedMax: TALLY_MEASURE_INFO[TALLY_MEASURE.WORD].defaultChartMax,
      ticks: {
        callback: val => kify(val),
        stepSize: undefined, // leaving this in because we'll want it for time charts
      }
    }
  };

  const legend = {
    // display: chartData.value.datasets.length > 1,
    display: true,
    position: 'bottom',
  }

  const tooltip = {
    callbacks: {
      label: ctx => formatCount(ctx.raw.count, ctx.dataset.measure),
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
  <LineChart
    :data="chartData"
    :options="chartOptions"
  />
</template>

<style scoped>
</style>
