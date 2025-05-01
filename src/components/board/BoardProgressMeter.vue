<script setup lang="ts">
import { computed, defineProps } from 'vue';

import { useChartColors } from '../chart/chart-colors';

import type { Board, FullParticipant } from 'src/lib/api/board.ts';
import { TallyMeasure } from 'server/lib/models/tally/consts';

import MeterGroup, { MeterItem } from 'primevue/metergroup';

const props = defineProps<{
  board: Board;
  participants: FullParticipant[];
  measure: TallyMeasure;
}>();

const contributions = computed(() => {
  const participantContributions = props.participants.map(participant => {
    const tallies = participant.tallies.filter(tally => tally.measure === props.measure);
    const total = tallies.reduce((totalSoFar, tally) => totalSoFar + tally.count, 0);

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
  if(props.measure in props.board.goal) {
    return Math.max(props.board.goal[props.measure], grandTotal.value);
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

<style scoped>
</style>
