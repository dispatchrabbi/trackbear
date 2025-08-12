<script setup lang="ts">
import { computed } from 'vue';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';

import ProgressChart, { SeriesTallyish } from '../chart/ProgressChart.vue';

const props = defineProps<{
  leaderboard: Leaderboard;
  participants: Participant[];
}>();

const filteredParticipants = computed(() => {
  return props.participants.map(participant => ({
    ...participant,
    tallies: participant.tallies.filter(tally => tally.measure === participant.goal.measure),
  })).filter(participant => participant.tallies.length > 0);
});

const seriesTallies = computed<SeriesTallyish[]>(() => {
  return filteredParticipants.value.flatMap(participant => participant.tallies.map(tally => ({
    date: tally.date,
    // we have to pre-calculate these as percentages
    count: 100 * (tally.count / participant.goal.count),
    series: participant.displayName,
  })));
});

</script>

<template>
  <ProgressChart
    :tallies="seriesTallies"
    measure-hint="percent"
    :start-date="leaderboard.startDate"
    :end-date="leaderboard.endDate"
    :goal-count="100"
    :show-legend="true"
    :graph-title="props.leaderboard.title"
  />
</template>
