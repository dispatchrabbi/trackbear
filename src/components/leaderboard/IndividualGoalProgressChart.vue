<script setup lang="ts">
import { computed } from 'vue';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';

import LineChart from '../chart/LineChart.vue';
import { accumulateTallies, listEachDayOfData, normalizeTallies } from '../chart/chart-functions.ts';
import { formatPercent } from 'src/lib/number.ts';

const props = defineProps<{
  leaderboard: Leaderboard;
  participants: Participant[];
}>();

const eachDay = computed(() => {
  const allDatesSet = new Set(props.participants.flatMap(participant => participant.tallies.map(tally => tally.date)));
  const sortedDates = [...allDatesSet].sort();
  const [earliestDate, latestDate] = [sortedDates.at(0) ?? null, sortedDates.at(-1) ?? null];

  const eachDay = listEachDayOfData(
    props.leaderboard.startDate, props.leaderboard.endDate,
    earliestDate, latestDate,
  );
  return eachDay;
});

const tallies = computed(() => {
  const tallies = props.participants.flatMap(participant => {
    const normalizedTallies = normalizeTallies(participant.tallies);
    const accumulatedTallies = accumulateTallies(normalizedTallies);

    const tallyData = accumulatedTallies.map(tally => ({
      series: participant.displayName,
      date: tally.date,
      value: +formatPercent(tally.value, participant.goal.count),
      raw: tally.value,
      measure: participant.goal.measure,
    }));
    return tallyData;
  });

  return tallies;
});

const par = computed(() => {
  const goalCount = 100; // the goal is always 100%, in this case

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
    measure-hint="percent"
  />
</template>
