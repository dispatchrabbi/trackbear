<script setup lang="ts">
import { computed } from 'vue';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';

import LineChart from '../chart/LineChart.vue';
import { accumulateTallies, listEachDayOfData, normalizeTallies } from '../chart/chart-functions.ts';
import { TallyMeasure } from 'server/lib/models/tally/consts.ts';

const props = defineProps<{
  leaderboard: Leaderboard;
  participants: Participant[];
  measure: TallyMeasure
}>();

const filteredParticipants = computed(() => {
  return props.participants.map(participant => ({
    ...participant,
    tallies: participant.tallies.filter(tally => tally.measure === props.measure),
  })).filter(participant => participant.tallies.length > 0);
});

const eachDay = computed(() => {
  const allDatesSet = new Set(filteredParticipants.value.flatMap(participant => participant.tallies.map(tally => tally.date)));
  const sortedDates = [...allDatesSet].sort();
  const [ earliestDate, latestDate ] = [ sortedDates.at(0) ?? null, sortedDates.at(-1) ?? null ];
  
  const eachDay = listEachDayOfData(
    props.leaderboard.startDate, props.leaderboard.endDate,
    earliestDate, latestDate
  );
  return eachDay;
});

const tallies = computed(() => {
  const tallies = filteredParticipants.value.flatMap(participant => {
    const normalizedTallies = normalizeTallies(participant.tallies);
    const accumulatedTallies = accumulateTallies(normalizedTallies);

    const tallyData = accumulatedTallies.map(tally => ({
      series: participant.displayName,
      date: tally.date,
      value: tally.value,
      raw: tally.value,
      measure: props.measure,
    }));
    return tallyData;
  });

  return tallies;
});

const par = computed(() => {
  const goalCount = props.leaderboard.goal[props.measure];
  if(goalCount === undefined) {
    // no goal for this measure, so no par line needed
    return null;
  }
  
  const par = eachDay.value.map((date, ix) => ({
  series: 'Par',
  date,
  value: props.leaderboard.endDate === null ?
    goalCount : // if there's no end date, just show a contant line at 100%
    (ix === eachDay.value.length - 1) ?
      goalCount : // force the last day to be 100%
      Math.ceil((goalCount / eachDay.value.length) * (ix + 1)),
  }));

  return par;
});

</script>

<template>
  <LineChart
    :par="par"
    :data="tallies"
    :measure-hint="measure"
  />
</template>
