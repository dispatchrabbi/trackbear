<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Tally } from 'src/lib/api/tally.ts';

import { getISODay, addMonths, startOfWeek } from 'date-fns';
import { parseDateString, formatDate } from 'src/lib/date.ts';

import { CompiledTallyPoint } from '../chart/chart-functions.ts';
import CalendarMatrixChart from '../chart/CalendarMatrixChart.vue';
import { MatrixChartData, MatrixChartOptions } from '../chart/CalendarMatrixChart.vue';
import { formatCount, compileTallies } from 'src/lib/tally.ts';

type ActivityHeatmapDataPoint = {
  x: string;
  y: string;
  date: string;
  value: number;
  point: CompiledTallyPoint;
};

const props = defineProps<{
  tallies: Array<Tally>;
}>();

const chartData = computed(() => {
  const today = new Date();
  const compiledPoints = compileTallies(
    props.tallies,
    formatDate(startOfWeek(addMonths(today, -1), { weekStartsOn: 1 })),
    formatDate(today),
  );

  const tallyData: ActivityHeatmapDataPoint[] = compiledPoints.map(point => ({
    x: point.date,
    y: '' + getISODay(parseDateString(point.date)),
    date: point.date,
    value: Object.keys(point.count).some(measure => point.count[measure] > 0) ? 1 : 0, // we just care about whether you actually did the thing (for now)
    point,
  }));

  const data: MatrixChartData = {
    datasets: [{
      label: 'Activity',
      data: tallyData,
    }]
  };

  return data;
});

const chartOptions: MatrixChartOptions = {
  plugins: {
    tooltip: {
      callbacks: {
        label: ctx => {
          const point = (ctx.raw as ActivityHeatmapDataPoint).point;

          const labels = [];
          for(const measure of Object.keys(point.count)) {
            if(point.count[measure] > 0) {
              labels.push(formatCount(point.count[measure], measure));
            }
          }

          return labels.length > 0 ? labels : 'No activity';
        },
      }
    }
  }
};

</script>

<template>
  <CalendarMatrixChart
    :data="chartData"
    :options="chartOptions"
    highlight-today
  />
</template>

<style scoped>
</style>
