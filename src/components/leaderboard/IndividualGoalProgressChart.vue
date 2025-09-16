<script setup lang="ts">
import { computed } from 'vue';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';

import ProgressChart, { SeriesTallyish } from '../chart/ProgressChart.vue';
import { type SeriesInfoMap } from '../chart/chart-functions';

const props = defineProps<{
  leaderboard: Leaderboard;
  participants: Participant[];
}>();

const filteredParticipants = computed(() => {
  return props.participants
    .filter(particpant => particpant.goal !== null)
    .map(participant => ({
      ...participant,
      tallies: participant.tallies.filter(tally => tally.measure === participant.goal!.measure),
    }))
    .filter(participant => participant.tallies.length > 0);
});

const seriesTallies = computed<SeriesTallyish[]>(() => {
  return filteredParticipants.value.flatMap(participant => participant.tallies.map(tally => ({
    date: tally.date,
    // we have to pre-calculate these as percentages
    count: 100 * (tally.count / participant.goal!.count),
    series: participant.uuid,
  })));
});

const seriesInfo = computed<SeriesInfoMap>(() => {
  const entries = filteredParticipants.value.map(participant => ([
    participant.uuid,
    {
      uuid: participant.uuid,
      name: participant.displayName,
      color: participant.color,
    },
  ]));

  return Object.fromEntries(entries);
});

</script>

<template>
  <ProgressChart
    :tallies="seriesTallies"
    measure-hint="percent"
    :series-info="seriesInfo"
    :start-date="leaderboard.startDate"
    :end-date="leaderboard.endDate"
    :goal-count="100"
    :show-legend="true"
    :graph-title="props.leaderboard.title"
  />
</template>
