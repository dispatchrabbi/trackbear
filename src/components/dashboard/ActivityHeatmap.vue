<script setup lang="ts">
import { computed } from 'vue';
import type { Tally } from 'src/lib/api/tally.ts';
import type { MeasureCounts } from 'server/lib/models/tally/types.ts';

import { addYears } from 'date-fns';
import { maxDate, formatDate, parseDateString } from 'src/lib/date.ts';

import { cmpTallies, compileTallies, formatCount } from 'src/lib/tally.ts';

import PlotCalendarHeatMap, { type CalendarHeatMapDataPoint } from '../chart/PlotCalendarHeatMap.vue';

import Card from 'primevue/card';

const props = withDefaults(defineProps<{
  tallies: Array<Tally>;
  weekStartsOn?: number;
}>(), {
  weekStartsOn: 0, // Sunday
});

const data = computed(() => {
  const today = new Date();
  const timelineStart = addYears(today, -1);

  const sortedTallies = props.tallies.toSorted(cmpTallies);

  const compiledTallies = compileTallies(
    sortedTallies,
    sortedTallies.length > 0 ? maxDate(sortedTallies[0].date, formatDate(timelineStart)) : formatDate(timelineStart),
    formatDate(today),
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

const normalizerFn = function(datum: CalendarHeatMapDataPoint<MeasureCounts>/* , data: CalendarHeatMapDataPoint[] */) {
  return Math.max(...Object.keys(datum.value).map(measure => (
    (maxima.value[measure] === 0 || datum.value[measure] === 0) ? 0 : (Math.abs(datum.value[measure]) / maxima.value[measure])
  )));
};
const valueFormatFn = function(datum: CalendarHeatMapDataPoint<MeasureCounts>) {
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
        :week-starts-on="props.weekStartsOn"
      />
    </template>
  </Card>
</template>

<style scoped>
</style>
