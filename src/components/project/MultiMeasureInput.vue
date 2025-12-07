<script setup lang="ts">
import { reactive, computed, onMounted, watch } from 'vue';

import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

const model = defineModel<MeasureCounts>();
const props = defineProps<{
  invalid: boolean;
  addButtonText?: string;
}>();

// TODO: convert this to a ref and figure out the rest of it
const entries = reactive<{ measure: TallyMeasure; count: number }[]>([]);
watch(entries, newEntries => {
  const collatedEntries = {};
  for(const entry of newEntries) {
    // do not filter - this should represent nulls if the input is still in the DOM
    // let the higher component deal with that
    collatedEntries[entry.measure] = entry.count;
  }

  model.value = collatedEntries;
});

const measuresLeft = computed(() => {
  const measuresTaken = entries.map(entry => entry.measure);
  return Object.keys(TALLY_MEASURE_INFO).filter(measure => !measuresTaken.includes(measure));
});

import Dropdown from 'primevue/dropdown';
import TallyCountInput from 'src/components/tally/TallyCountInput.vue';
import Button from 'primevue/button';
import { PrimeIcons } from 'primevue/api';
import { type MeasureCounts } from 'server/lib/models/tally/types';
import { type TallyMeasure } from 'server/lib/models/tally/consts';

const dropdownOptions = Object.keys(TALLY_MEASURE_INFO).map(measure => ({
  label: TALLY_MEASURE_INFO[measure].label.plural,
  value: measure,
}));

const handleAddStartingEntryClick = function() {
  if(measuresLeft.value.length === 0) { return; } // nothing more we can add (and the button should be gone anyway)

  entries.push({ measure: measuresLeft.value[0], count: 0 });
};

const handleRemoveStartingEntryClick = function(measure) {
  const entryIx = entries.findIndex(entry => entry.measure === measure);
  if(entryIx < 0) { return; } // balance wasn't found

  entries.splice(entryIx, 1);
};

onMounted(() => {
  if(model.value === undefined) { return; }

  for(const measure of Object.keys(model.value)) {
    entries.push({ measure, count: model.value[measure] });
  }
});

</script>

<template>
  <div>
    <div
      v-for="entry of entries"
      :key="entry.measure"
      class="flex gap-2 mb-2"
    >
      <Dropdown
        v-model="entry.measure"
        :options="dropdownOptions.filter(option => [entry.measure, ...measuresLeft].includes(option.value))"
        option-label="label"
        option-value="value"
      />
      <TallyCountInput
        v-model="entry.count"
        :measure="entry.measure"
        :invalid="props.invalid"
      />
      <Button
        :icon="PrimeIcons.MINUS_CIRCLE"
        severity="danger"
        size="small"
        text
        @click="() => handleRemoveStartingEntryClick(entry.measure)"
      />
    </div>
    <div
      v-if="measuresLeft.length > 0"
    >
      <Button
        :icon="PrimeIcons.PLUS_CIRCLE"
        severity="secondary"
        :label="props.addButtonText ?? 'Add Entry'"
        size="small"
        outlined
        text
        @click="handleAddStartingEntryClick"
      />
    </div>
  </div>
</template>
