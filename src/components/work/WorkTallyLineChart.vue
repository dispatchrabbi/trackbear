<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import type { Work } from 'src/lib/api/work.ts';
import type { Tally } from 'src/lib/api/tally.ts';
import type { Tag } from 'src/lib/api/tag.ts';

import { kify } from 'src/lib/number.ts';
import { formatDuration } from "src/lib/date.ts";
import { formatCount } from 'src/lib/tally.ts';
import { toTitleCase } from 'src/lib/str.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import { normalizeTallies, accumulateTallies, listEachDayOfData } from '../chart/chart-functions';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import LineChart from 'src/components/chart/LineChart.vue';
import type { LineChartOptions } from 'src/components/chart/LineChart.vue';
import { TALLY_MEASURE } from 'server/lib/entities/tally';

const props = defineProps<{
  work: Work;
  tallies: Array<Tally & { tags: Tag[] }>;
}>();

const measuresAvailable = computed(() => {
  const measuresPresent = new Set(props.tallies.map(tally => tally.measure));
  return Object.keys(TALLY_MEASURE_INFO).filter(measure => measuresPresent.has(measure));
});
const selectedMeasure = ref(measuresAvailable.value[0]);

const chartData = computed(() => {
  const filteredTallies = props.tallies.filter(tally => tally.measure === selectedMeasure.value);
  const normalizedTallies = normalizeTallies(filteredTallies);

  const data = {
    labels: listEachDayOfData(null, null, normalizedTallies[0].date, normalizedTallies[normalizedTallies.length - 1].date),
    datasets: [{
      label: props.work.title,
      measure: selectedMeasure.value,
      data: accumulateTallies(normalizedTallies),
    }],
  };

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
      suggestedMax: TALLY_MEASURE_INFO[selectedMeasure.value].defaultChartMax,
      ticks: {
        callback: val => selectedMeasure.value === TALLY_MEASURE.TIME ? formatDuration(val, true) : kify(val),
        stepSize: selectedMeasure.value === TALLY_MEASURE.TIME ? 60 : undefined,
      }
    }
  };

  const legend = {
    display: chartData.value.datasets.length > 1,
    position: 'bottom',
  };

  const tooltip = {
    callbacks: {
      label: ctx => formatCount(ctx.raw.value, ctx.dataset.measure),
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
  <TabView
    @update:active-index="index => selectedMeasure = measuresAvailable[index]"
  >
    <TabPanel
      v-for="measure of measuresAvailable"
      :key="measure"
      :header="toTitleCase(TALLY_MEASURE_INFO[measure].label.plural)"
    >
      <!-- @vue-expect-error chartData won't ever be exactly the right type, due to ChartJS being highly configurable -->
      <LineChart
        :data="chartData"
        :options="chartOptions"
      />
    </TabPanel>
  </TabView>
</template>

<style scoped>
</style>
