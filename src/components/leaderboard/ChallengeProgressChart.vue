<script setup lang="ts">
import { computed } from 'vue';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';

import ProgressChart, { type SeriesTallyish } from '../chart/ProgressChart.vue';
import { type SeriesInfoMap } from '../chart/chart-functions';
import { type TallyMeasure } from 'server/lib/models/tally/consts.ts';

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
    :measure-hint="measure"
    :series-info="seriesInfo"
    :start-date="leaderboard.startDate"
    :end-date="leaderboard.endDate"
    :goal-count="leaderboard.goal[measure]"
    :show-legend="true"
    :graph-title="props.leaderboard.title"
  />
</template>
