<script setup lang="ts">
import { computed, defineProps } from 'vue';

import type { Board, ParticipantWithTallies } from 'src/lib/api/board.ts';

import { normalizeTallies, accumulateTallies, listEachDayOfData } from '../chart/chart-functions.ts';
import { TallyMeasure } from 'server/lib/models/tally.ts';
import { formatCount } from 'src/lib/tally.ts';

import PlotProgressChart from 'src/components/chart/PlotProgressChart.vue';
import { densifyTallies } from '../chart/chart-functions.ts';

const props = defineProps<{
  board: Board;
  participants: ParticipantWithTallies[];
  measure: TallyMeasure;
}>();

const chartData = computed(() => {
  const [ earliestDate, latestDate ] = props.participants
    .flatMap(participant => participant.tallies
      .filter(tally => tally.measure === props.measure)
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

  // add a par if needed
  if(props.measure in props.board.goal) {
    const goalCount = props.board.goal[props.measure];

    const parData = eachDay.map((date, ix) => ({
      series: 'Par',
      date,
      value: props.board.endDate === null ?
        goalCount :
        (ix === eachDay.length - 1) ? goalCount : Math.ceil((goalCount / eachDay.length) * (ix + 1)),
    }));
    data.par = parData;
  }

  data.tallies = props.participants.flatMap(participant => {
    const tallies = participant.tallies.filter(tally => tally.measure === props.measure);
    const densifiedTallies = props.board.fundraiserMode ? densifyTallies(tallies, eachDayOfData) : tallies;
    const normalizedTallies = normalizeTallies(densifiedTallies);
    const accumulatedTallies = accumulateTallies(normalizedTallies);

    const participantTallyData = accumulatedTallies.map(tally => ({
      series: participant.displayName,
      date: tally.date,
      value: tally.value,
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
    :is-stacked="props.board.fundraiserMode"
    :value-format-fn="d => formatCount(d, props.measure)"
  />
</template>

<style scoped>
</style>
