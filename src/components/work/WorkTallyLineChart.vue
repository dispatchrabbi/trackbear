<script setup lang="ts">
import { ref, computed, watch, defineProps } from 'vue';
import type { Work } from 'src/lib/api/work.ts';
import type { TallyWithTags } from 'src/lib/api/tally.ts';

import { toTitleCase } from 'src/lib/str.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import { normalizeTallies, accumulateTallies } from '../chart/chart-functions.ts';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import LineChart from '../chart/LineChart.vue';

const props = defineProps<{
  work: Work;
  tallies: Array<TallyWithTags>;
}>();

const measuresAvailable = computed(() => {
  const measuresPresent = new Set(props.tallies.map(tally => tally.measure));
  return Object.keys(TALLY_MEASURE_INFO).filter(measure => measuresPresent.has(measure));
});

const selectedMeasure = ref(measuresAvailable.value[0]);
watch(measuresAvailable, newMeasuresAvailable => {
  if(!newMeasuresAvailable.includes(selectedMeasure.value)) {
    selectedMeasure.value = measuresAvailable.value[0];
  }
});

const data = computed(() => {
  const filteredTallies = props.tallies.filter(tally => tally.measure === selectedMeasure.value);
  const normalizedTallies = normalizeTallies(filteredTallies);

  const startingBalance = props.work.startingBalance[selectedMeasure.value] || 0;
  const accumulatedTallies = accumulateTallies(normalizedTallies, startingBalance);

  const data = accumulatedTallies.map(tally => ({
    series: props.work.title,
    date: tally.date,
    value: tally.accumulated,
  }));

  return data;
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
      <LineChart
        :data="data"
        :measure-hint="measure"
        :show-legend="false"
      />
    </TabPanel>
  </TabView>
</template>

<style scoped>
</style>
server/lib/models/tally.ts
