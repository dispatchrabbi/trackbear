<script setup lang="ts">
import { computed, defineProps } from 'vue';

import { useChartColors } from '../chart/chart-colors';

import type { Leaderboard } from 'src/lib/api/leaderboard';
import type { TallyMeasure } from 'server/lib/models/tally/consts';
import type { LeaderboardSeries } from './use-leaderboard-series';

import MeterGroup, { MeterItem } from 'primevue/metergroup';
import { mapSeriesToColor, SeriesInfoMap } from '../chart/chart-functions';

const props = defineProps<{
  leaderboard: Leaderboard;
  series: LeaderboardSeries[];
  seriesInfo: SeriesInfoMap;
  measure: TallyMeasure;
}>();

const contributions = computed(() => {
  const seriesContributions = props.series.map(s => {
    const total = s.tallies.reduce((totalSoFar, tally) => (
      totalSoFar + (tally.measure === props.measure ? tally.count : 0)
    ), 0);

    return {
      series: s,
      total,
    };
  })
    .filter(s => s.total > 0)
    .sort((a, b) => a.total < b.total ? 1 : a.total > b.total ? -1 : 0);

  return seriesContributions;
});

const chartColors = useChartColors();

const meterValue = computed(() => {
  const seriesOrder = contributions.value.map(contribution => contribution.series.uuid);
  const colorOrder = mapSeriesToColor(props.seriesInfo, seriesOrder, chartColors.value);

  const value = contributions.value.map((total, ix) => {
    return {
      label: total.series.name,
      value: total.total,
      color: colorOrder[ix],
    } as MeterItem;
  });

  return value;
});

const grandTotal = computed(() => {
  return contributions.value.reduce((totalSoFar, c) => totalSoFar + c.total, 0);
});

const max = computed(() => {
  if(props.measure in props.leaderboard.goal) {
    return Math.max(props.leaderboard.goal[props.measure], grandTotal.value);
  } else {
    return grandTotal.value;
  }
});

</script>

<template>
  <MeterGroup
    :value="meterValue"
    :max="max"
  />
</template>
