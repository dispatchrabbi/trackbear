<script setup lang="ts">
import { computed } from 'vue';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';

import FundraiserChart, { SeriesTallyish } from '../chart/FundraiserChart.vue';
import { TallyMeasure } from 'server/lib/models/tally/consts.ts';

const props = defineProps<{
  leaderboard: Leaderboard;
  participants: Participant[];
  measure: TallyMeasure;
}>();

const filteredParticipants = computed(() => {
  return props.participants.map(participant => ({
    ...participant,
    tallies: participant.tallies.filter(tally => tally.measure === props.measure),
  })).filter(participant => participant.tallies.length > 0);
});

const seriesTallies = computed<SeriesTallyish[]>(() => {
  return filteredParticipants.value.flatMap(participant => participant.tallies.map(tally => ({
    date: tally.date,
    count: tally.count,
    series: participant.displayName,
  })));
});

</script>

<template>
  <FundraiserChart
    :tallies="seriesTallies"
    :measure-hint="measure"
    :start-date="leaderboard.startDate"
    :end-date="leaderboard.endDate"
    :goal-count="leaderboard.goal[measure]"
    :show-legend="true"
    :graph-title="props.leaderboard.title"
  />
</template>
