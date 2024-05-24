<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
const breakpoints = useBreakpoints(breakpointsTailwind);

import type { Board, ParticipantWithTallies } from 'src/lib/api/board.ts';

import { kify } from 'src/lib/number.ts';
import { formatDuration } from "src/lib/date.ts";
import { formatCount } from 'src/lib/tally.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import { normalizeTallies, accumulateTallies, listEachDayOfData } from '../chart/chart-functions.ts';
import LineChart from 'src/components/chart/LineChart.vue';
import type { LineChartOptions } from 'src/components/chart/LineChart.vue';
import { TALLY_MEASURE, TallyMeasure } from 'server/lib/models/tally.ts';

const props = defineProps<{
  board: Board;
  participants: ParticipantWithTallies[];
  measure: TallyMeasure;
}>();

const size = computed(() => {
  return breakpoints.smaller('md').value ? 'mobile' : 'desktop';
});

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

  const data = {
    labels: eachDay,
    datasets: [],
  };

  // add a par if needed
  if(props.measure in props.board.goal) {
    const goalCount = props.board.goal[props.measure];
    const parDataset = {
      label: 'Par',
      data: props.board.endDate === null ?
        eachDay.map(date => ({ date, value: goalCount })) :
        eachDay.map((date, ix) => ({
          date,
          value: (ix === eachDay.length - 1) ? goalCount : Math.ceil((goalCount / eachDay.length) * (ix + 1)),
        })),
      pointRadius: 0,
      borderDash: [8],
    };

    data.datasets.push(parDataset);
  }

  const sortedParticipants = props.participants.toSorted((a, b) => {
    const aDisplayName = a.displayName.toLowerCase();
    const bDisplayName = b.displayName.toLowerCase();
    return aDisplayName < bDisplayName ? -1 : aDisplayName > bDisplayName ? 1 : 0;
  })
  for(const participant of sortedParticipants) {
    const normalizedTallies = normalizeTallies(participant.tallies.filter(tally => tally.measure === props.measure));
    const accumulatedTallies = accumulateTallies(normalizedTallies);

    const participantDataset = {
      label: participant.displayName,
      avatar: participant.avatar,
      data: accumulatedTallies,
      pointRadius: size.value === 'mobile' ? 1 : null,
    };

    if(participantDataset.data.length > 0) {
      data.datasets.push(participantDataset);
    }
  }

  return data;
});

const chartOptions = computed(() => {
  const parsing = {
    xAxisKey: 'date',
    yAxisKey: 'value',
  };

  const scales = {
    y: {
      type: 'linear',
      suggestedMin: 0,
      suggestedMax: TALLY_MEASURE_INFO[props.measure].defaultChartMax,
      ticks: {
        callback: val => props.measure === TALLY_MEASURE.TIME ? formatDuration(val, true) : kify(val),
        stepSize: props.measure === TALLY_MEASURE.TIME ? 60 : undefined,
      }
    }
  };

  const legend = {
    display: chartData.value.datasets.length > 1,
    position: 'bottom',
  };

  const tooltip = {
    callbacks: {
      label: ctx => ctx.dataset.label,
      afterLabel: ctx => formatCount(ctx.raw.value, props.measure),
    },
  };

  const options = {
    parsing,
    scales,
    plugins: {
      legend,
      tooltip,
    },
  };

  return options as LineChartOptions;
});

</script>

<template>
  <LineChart
    :data="chartData"
    :options="chartOptions"
  />
</template>

<style scoped>
</style>
