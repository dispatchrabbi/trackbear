<script setup lang="ts">
import { ref, computed, watch, defineProps } from 'vue';
import type { Work } from 'src/lib/api/work.ts';
import type { TallyWithTags } from 'src/lib/api/tally.ts';

import { toTitleCase } from 'src/lib/str.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import ProgressChart, { SeriesTallyish } from '../chart/ProgressChart.vue';

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

const filteredTallies = computed(() => {
  return props.tallies.filter(tally => tally.measure === selectedMeasure.value);
});

const seriesTallies = computed<SeriesTallyish[]>(() => {
  return filteredTallies.value.map(tally => ({
    date: tally.date,
    count: tally.count,
    series: props.work.title,
  }));
});

const startingTotal = computed(() => {
  return props.work.startingBalance[selectedMeasure.value] || 0;
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
      <ProgressChart
        :tallies="seriesTallies"
        :measure-hint="measure"
        :starting-total="startingTotal"
        :show-legend="false"
        :graph-title="props.work.title"
      />
    </TabPanel>
  </TabView>
</template>

<style scoped>
</style>
server/lib/models/tally.ts
