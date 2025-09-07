<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { DayCount } from 'src/lib/api/stats.ts';

import { parseDateString, cmpByDate, formatDate } from 'src/lib/date.ts';

import Card from 'primevue/card';
import PlotCalendarHeatMap, { CalendarHeatMapDataPoint } from 'src/components/chart/PlotCalendarHeatMap.vue';

import { formatCount } from 'src/lib/tally.ts';
import { eachDayOfInterval } from 'date-fns';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { MeasureCounts } from 'server/lib/models/tally/types';

const props = withDefaults(defineProps<{
  dayCounts: Array<DayCount>;
  anchor?: 'start' | 'end';
  weekStartsOn?: number;
}>(), {
  anchor: 'start',
  weekStartsOn: 0, // Sunday
});

const data = computed(() => {
  if(props.dayCounts.length === 0) {
    return [];
  }

  const sortedCounts = props.dayCounts.toSorted(cmpByDate).map(c => ({
    date: c.date,
    value: c.counts,
  }));

  const countMap = sortedCounts.reduce((obj, day) => {
    obj[day.date] = day.value;
    return obj;
  }, {});

  const days = eachDayOfInterval({
    start: parseDateString(sortedCounts[0].date),
    end: parseDateString(sortedCounts.at(-1)!.date),
  });

  const densifiedCounts = days.map(day => ({
    date: day,
    value: countMap[formatDate(day)] ?? { [TALLY_MEASURE.WORD]: 0 },
  }));

  return densifiedCounts;
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
        v-if="props.dayCounts.length > 0"
        :data="data"
        :anchor="props.anchor"
        :normalizer-fn="normalizerFn"
        :value-format-fn="valueFormatFn"
        :week-starts-on="props.weekStartsOn"
      />
    </template>
  </Card>
</template>

<style scoped>
</style>
