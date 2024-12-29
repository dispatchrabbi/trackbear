<script setup lang="ts">
import { computed, defineProps } from 'vue';

import type { Board, ParticipantWithTallies } from 'src/lib/api/board.ts';
import { TallyMeasure } from "server/lib/models/tally/consts";
import { formatCountValue, formatCountCounter } from 'src/lib/tally.ts'; // TODO: change percentage to formatted count? or both?

import StatTile from '../goal/StatTile.vue';

const props = defineProps<{
  board: Board;
  participants: ParticipantWithTallies[];
  measure: TallyMeasure;
}>();

const contributions = computed(() => {
  const participantContributions = props.participants.map(participant => {
    const tallies = participant.tallies.filter(tally => tally.measure === props.measure);
    const total = tallies.reduce((totalSoFar, tally) => totalSoFar + tally.count, 0);

    return {
      participant,
      total
    };
  })
    .filter(participant => participant.total > 0)
    .sort((a, b) => a.total < b.total ? 1 : a.total > b.total ? -1 : 0);

  return participantContributions;
});

const grandTotal = computed(() => {
  return contributions.value.reduce((totalSoFar, c) => totalSoFar + c.total, 0);
});

</script>

<template>
  <StatTile
    class="mb-2"
    top-legend="Your combined total is"
    :highlight="formatCountValue(grandTotal, props.measure)"
    :suffix="formatCountCounter(grandTotal, props.measure)"
  />
</template>

<style scoped>
</style>
