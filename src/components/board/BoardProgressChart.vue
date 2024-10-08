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

const participants = computed(() => {
  return props.participants.filter(participant => participant.tallies.filter(tally => tally.measure === props.measure).length > 0);
})

const chartData = computed(() => {
  const [ earliestDate, latestDate ] = participants.value
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

  data.tallies = participants.value.flatMap(participant => {
    const tallies = participant.tallies.filter(tally => tally.measure === props.measure);
    const normalizedTallies = normalizeTallies(tallies);
    const densifiedTallies = props.board.fundraiserMode ? densifyTallies(normalizedTallies, eachDayOfData) : normalizedTallies;
    const accumulatedTallies = accumulateTallies(densifiedTallies);

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
    :config="{
      measureHint: props.measure,
      seriesTitle: 'Participant',
      showLegend: true,
    }"
    :value-format-fn="d => formatCount(d, props.measure)"
  />
</template>

<style scoped>
</style>
