<script setup lang="ts">
import { computed, defineProps } from 'vue';

import { type Work } from 'src/lib/api/work.ts';
import { WORK_PHASE } from 'server/lib/models/work/consts';
import type { Tally } from 'src/lib/api/tally.ts';

import { formatDate, parseDateString } from 'src/lib/date.ts';

import { cmpTallies, compileTallies, formatCount } from 'src/lib/tally.ts';

import PlotCalendarHeatMap, { type CalendarHeatMapDataPoint } from '../chart/PlotCalendarHeatMap.vue';

import Card from 'primevue/card';

const props = defineProps<{
  work: Work;
  tallies: Array<Tally>;
}>();

// for inactive projects, we'll show a heatmap for the time the project was active
const INACTIVE_WORK_PHASES = [
  WORK_PHASE.ABANDONED,
  WORK_PHASE.FINISHED,
  WORK_PHASE.ON_HOLD,
];

const data = computed(() => {
  if(props.tallies.length === 0) {
    return [];
  }

  const sortedTallies = props.tallies.toSorted(cmpTallies);

  const today = new Date();
  const compiledTallies = compileTallies(
    sortedTallies,
    sortedTallies[0].date, // we don't care about limiting the startDate — let the heatmap show as much data as it can
    INACTIVE_WORK_PHASES.includes(props.work.phase) ? sortedTallies.at(-1).date : formatDate(today), // for inactive projects, don't show past the last tally
  );

  const compiledData = compiledTallies.map(compiledTally => ({
    date: parseDateString(compiledTally.date),
    value: compiledTally.count,
  }));

  return compiledData;
});

const maxima = computed(() => {
  return data.value.reduce((obj, datum) => {
    for(const measure of Object.keys(datum.value)) {
      obj[measure] = Math.max(obj[measure] || 0, Math.abs(datum.value[measure]));
    }

    return obj;
  }, {});
});

const normalizerFn = function(datum: CalendarHeatMapDataPoint/* , data: CalendarHeatMapDataPoint[] */) {
  return Math.max(...Object.keys(datum.value).map(measure => (
    (maxima.value[measure] === 0 || datum.value[measure] === 0) ? 0 : (Math.abs(datum.value[measure]) / maxima.value[measure])
  )));
};
const valueFormatFn = function(datum: CalendarHeatMapDataPoint) {
  return Object.keys(datum.value).filter(measure => datum.value[measure] !== 0).map(measure => formatCount(datum.value[measure], measure)).join('\n');
};

</script>

<template>
  <Card
    class="max-w-full"
    :pt="{
      content: { class: 'py-0 px-5 md:px-6' }
    }"
  >
    <template #content>
      <PlotCalendarHeatMap
        v-if="props.tallies.length > 0"
        :data="data"
        anchor="end"
        constrain-width
        :normalizer-fn="normalizerFn"
        :value-format-fn="valueFormatFn"
      />
    </template>
  </Card>
</template>

<style scoped>
</style>
