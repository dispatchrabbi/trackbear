<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Work } from 'src/lib/api/work.ts';
import type { Tally } from 'src/lib/api/tally.ts';
import type { Tag } from 'src/lib/api/tag.ts';

import { getISODay, addDays } from 'date-fns';
import { parseDateString, formatDate } from 'src/lib/date.ts';

import { normalizeTallies, densifyTallies, listEachDayOfData } from '../chart/chart-functions';
import CalendarMatrixChart from '../chart/CalendarMatrixChart.vue';
import { MatrixChartData } from '../chart/CalendarMatrixChart.vue';

const props = defineProps<{
  work: Work;
  tallies: Array<Tally & { tags: Tag[] }>;
}>();

const chartData = computed(() => {
  const normalizedTallies = normalizeTallies(props.tallies);
  const eachDay = listEachDayOfData(null, formatDate(addDays(parseDateString(normalizedTallies[0].date), 365)), normalizedTallies[0].date, normalizedTallies[normalizedTallies.length - 1].date);

  const data = {
    datasets: [{
      label: props.work.title,
      data: densifyTallies(normalizedTallies, eachDay).map(tally => ({
        x: tally.date,
        y: '' + getISODay(parseDateString(tally.date)),
        date: tally.date,
        value: tally.value ? 1 : 0, // we just care about whether you actually did the thing
      })),
    }],
  };

  return data as MatrixChartData;
});

</script>

<template>
  <CalendarMatrixChart
    :data="chartData"
  />
</template>

<style scoped>
</style>
