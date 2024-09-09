<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { DayCount } from 'src/lib/api/stats.ts';

import { parseDateString, cmpByDate } from 'src/lib/date.ts';

import CalendarHeatMap, { CalendarHeatMapDataPoint } from 'src/components/chart/CalendarHeatMap.vue';
import { formatCount } from 'src/lib/tally.ts';

const props = defineProps<{
  dayCounts: Array<DayCount>;
}>();

const data = computed(() => {
  return props.dayCounts.toSorted(cmpByDate).map(c => ({
    date: parseDateString(c.date),
    value: c.counts
  }));
});

const maxima = computed(() => {
  return data.value.reduce((obj, datum) => {
    for(const measure of Object.keys(datum.value)) {
      obj[measure] = Math.max(obj[measure] || 0, Math.abs(datum.value[measure]));
    }

    return obj;
  }, {});
});

const normalizerFn = function(datum: CalendarHeatMapDataPoint/*, data: CalendarHeatMapDataPoint[]*/) {
  return Math.max(...Object.keys(datum.value).map(measure => maxima.value[measure] === 0 ? 0 : datum.value[measure] / maxima.value[measure]));
};
const valueFormatFn = function(datum: CalendarHeatMapDataPoint) {
  return Object.keys(datum.value).filter(measure => datum.value[measure] > 0).map(measure => formatCount(datum.value[measure], measure)).join('\n');
};

</script>

<template>
  <CalendarHeatMap
    v-if="props.dayCounts.length > 0"
    :data="data"
    start="end"
    :normalizer-fn="normalizerFn"
    :value-format-fn="valueFormatFn"
  />
</template>

<style scoped>
</style>
