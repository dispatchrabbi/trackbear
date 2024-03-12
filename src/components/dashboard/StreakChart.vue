<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Tally } from 'src/lib/api/tally.ts';

import { getISODay, addDays } from 'date-fns';
import { parseDateString, formatDate } from 'src/lib/date.ts';

import Color from 'color';
import twColors from 'tailwindcss/colors.js';
import { DEFAULT_MATRIX_COLORS } from '../chart/calendar-matrix-chart-defaults.ts';
import { usePreferredColorScheme } from '@vueuse/core';
const colorScheme = usePreferredColorScheme();

import { normalizeTallies, densifyTallies, listEachDayOfData } from '../chart/chart-functions.ts';
import CalendarMatrixChart from '../chart/CalendarMatrixChart.vue';
import { MatrixChartData } from '../chart/CalendarMatrixChart.vue';

const props = defineProps<{
  tallies: Array<Tally>;
}>();

const chartData = computed(() => {
  const normalizedTallies = normalizeTallies(props.tallies);
  const firstDate = normalizedTallies.length > 0 ? parseDateString(normalizedTallies[0].date) : new Date();
  const lastDate = normalizedTallies.length > 0 ? normalizedTallies[normalizedTallies.length - 1].date : null;
  const eachDay = listEachDayOfData(null, formatDate(addDays(firstDate, 365)), formatDate(firstDate), lastDate);

  const tallyData = densifyTallies(normalizedTallies, eachDay).map(tally => ({
    x: tally.date,
    y: '' + getISODay(parseDateString(tally.date)),
    date: tally.date,
    value: tally.value ? 1 : 0, // we just care about whether you actually did the thing
  }));
  const maxValue = tallyData.reduce((max, tally) => Math.max(max, tally.value), 0);
  const today = formatDate(new Date());

  const baseColor = DEFAULT_MATRIX_COLORS.primary[colorScheme.value];
  const todayColor = { light: twColors.yellow[500], dark: twColors.yellow[400] }[colorScheme.value];

  const data = {
    datasets: [{
      label: 'Activity',
      data: tallyData,
      backgroundColor: function(ctx) {
        const value = ctx.dataset.data[ctx.dataIndex].value;
        const alpha = maxValue === 0 ? 0 : value / maxValue;

        if(ctx.dataset.data[ctx.dataIndex].date > today) {
          return 'rgba(0, 0, 0, 0)';
        } else if(ctx.dataset.data[ctx.dataIndex].date === today) {
          return Color(todayColor).alpha(alpha).rgb().string();
        } else {
          return Color(baseColor).alpha(alpha).rgb().string();
        }
      },
      borderColor: function(ctx) {
        const value = ctx.dataset.data[ctx.dataIndex].value;

        if(ctx.dataset.data[ctx.dataIndex].date > today) {
          return 'rgba(0, 0, 0, 0)';
        } else if(ctx.dataset.data[ctx.dataIndex].date === today) {
          const alpha = maxValue === 0 ? 1 : Math.max(value / maxValue, 0.1);
          return Color(todayColor).alpha(alpha).darken(0.3).rgb().string();
        } else {
          const alpha = maxValue === 0 ? 0.1 : Math.max(value / maxValue, 0.1);
          return Color(baseColor).alpha(alpha).darken(0.3).rgb().string();
        }
      }
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
