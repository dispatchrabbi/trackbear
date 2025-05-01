<script setup lang="ts">
import { computed, defineProps } from 'vue';

import { useChartColors } from '../chart/chart-colors';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';
import { TallyMeasure } from 'server/lib/models/tally/consts';

import MeterGroup, { MeterItem } from 'primevue/metergroup';

const props = defineProps<{
  leaderboard: Leaderboard;
  participants: Participant[];
  measure: TallyMeasure;
}>();

const contributions = computed(() => {
  const participantContributions = props.participants.map(participant => {
    const total = participant.tallies.reduce((totalSoFar, tally) => (
      totalSoFar + (tally.measure === props.measure ? tally.count : 0)
    ), 0);

    return {
      participant,
      total,
    };
  })
    .filter(participant => participant.total > 0)
    .sort((a, b) => a.total < b.total ? 1 : a.total > b.total ? -1 : 0);

  return participantContributions;
});

const chartColors = useChartColors();

const meterValue = computed(() => {
  const value = contributions.value.map((total, ix) => {
    return {
      label: total.participant.displayName,
      value: total.total,
      color: chartColors.value.data[ix % chartColors.value.data.length],
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
