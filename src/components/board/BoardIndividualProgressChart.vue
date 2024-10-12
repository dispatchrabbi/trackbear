<script setup lang="ts">
import { computed, defineProps } from 'vue';

import type { Board, ParticipantWithTallies } from 'src/lib/api/board.ts';

import { normalizeTallies, accumulateTallies, listEachDayOfData } from '../chart/chart-functions.ts';

import PlotProgressChart from 'src/components/chart/PlotProgressChart.vue';
import { densifyTallies } from '../chart/chart-functions.ts';
import { formatPercent } from 'src/lib/number.ts';

const props = defineProps<{
  board: Board;
  participants: ParticipantWithTallies[];
}>();

const isFundraiserMode = computed(() => {
  return props.board.fundraiserMode && !props.board.individualGoalMode;
});

const participants = computed(() => {
  return props.participants.filter(participant => participant.tallies.filter(tally => tally.measure === participant.goal.measure).length > 0);
})

const chartData = computed(() => {
  const [ earliestDate, latestDate ] = participants.value
    .flatMap(participant => participant.tallies
      .filter(tally => tally.measure === participant.goal.measure)
      .map(tally => tally.date)
    )
    .reduce(([earliest, latest], date) => {
      return [
        earliest === null ? date : date < earliest ? date : earliest,
        latest === null ? date : date > latest ? date : latest,
      ];
    }, [ null, null ]);
  const eachDay = listEachDayOfData(props.board.startDate, props.board.endDate, earliestDate, latestDate);
  const eachDayOfData = listEachDayOfData(props.board.startDate, null, earliestDate, latestDate);

  const data = {
    tallies: [],
    par: null,
  };

  // add a par line from 0 to 100%
  const goalCount = 100;

  const parData = eachDay.map((date, ix) => ({
    series: 'Par',
    date,
    value: props.board.endDate === null ?
      goalCount :
      (ix === eachDay.length - 1) ? goalCount : Math.ceil((goalCount / eachDay.length) * (ix + 1)),
  }));
  data.par = parData;

  data.tallies = participants.value.flatMap(participant => {
    const tallies = participant.tallies.filter(tally => tally.measure === participant.goal.measure);
    const normalizedTallies = normalizeTallies(tallies);
    const densifiedTallies = isFundraiserMode.value ? densifyTallies(normalizedTallies, eachDayOfData) : normalizedTallies;
    const accumulatedTallies = accumulateTallies(densifiedTallies);

    const participantTallyData = accumulatedTallies.map(tally => ({
      series: participant.displayName,
      date: tally.date,
      value: +formatPercent(tally.value, participant.goal.count),
      raw: tally.value,
      measure: participant.goal.measure,
    }));
    return participantTallyData;
  });

  return data;
});

</script>

<template>
  <PlotProgressChart
    :data="chartData.tallies"
    :par="chartData.par"
    :is-stacked="isFundraiserMode"
    :config="{
      measureHint: 'percent',
      seriesTitle: 'Participant',
      showLegend: true,
    }"
    :value-format-fn="d => `${d}%`"
  />
</template>

<style scoped>
</style>
