<script setup lang="ts">
import { reactive, computed, defineModel, defineProps, onMounted, watch } from 'vue';

import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

const model = defineModel<Record<keyof typeof TALLY_MEASURE_INFO, number>>();
const props = defineProps<{
  invalid: boolean;
}>();

const balances = reactive<{ measure: keyof typeof TALLY_MEASURE_INFO; count: number; }[]>([]);
watch(balances, (newBalances) => {
  const collatedBalances = {};
  for(const balance of newBalances) {
    // do not filter - this should represent nulls if the input is still in the DOM
    // let the higher component deal with that
    collatedBalances[balance.measure] = balance.count;
  }

  model.value = collatedBalances;
});

const measuresLeft = computed(() => {
  const measuresTaken = balances.map(balance => balance.measure);
  return Object.keys(TALLY_MEASURE_INFO).filter(measure => !measuresTaken.includes(measure));
});

import Dropdown from 'primevue/dropdown';
import TallyCountInput from 'src/components/tally/TallyCountInput.vue';
import Button from 'primevue/button';
import { PrimeIcons } from 'primevue/api';

const dropdownOptions = Object.keys(TALLY_MEASURE_INFO).map(measure => ({
  label: TALLY_MEASURE_INFO[measure].label.plural,
  value: measure,
}));

const handleAddStartingBalanceClick = function() {
  if(measuresLeft.value.length === 0) { return; } // nothing more we can add (and the button should be gone anyway)

  balances.push({ measure: measuresLeft.value[0], count: 0 });
}

const handleRemoveStaringBalanceClick = function(measure) {
  const balanceIx = balances.findIndex(balance => balance.measure === measure);
  if(balanceIx < 0) { return; } // balance wasn't found

  balances.splice(balanceIx, 1);
}

onMounted(() => {
  for(const measure of Object.keys(model.value)) {
    balances.push({ measure, count: model.value[measure]});
  }
});

</script>

<template>
  <div>
    <div
      v-for="balance of balances"
      :key="balance.measure"
      class="flex gap-2 mb-2"
    >
      <Dropdown
        v-model="balance.measure"
        :options="dropdownOptions.filter(option => [balance.measure, ...measuresLeft].includes(option.value))"
        option-label="label"
        option-value="value"
      />
      <TallyCountInput
        v-model="balance.count"
        :measure="balance.measure"
        :invalid="props.invalid"
      />
      <Button
        :icon="PrimeIcons.MINUS_CIRCLE"
        severity="danger"
        size="small"
        text
        @click="() => handleRemoveStaringBalanceClick(balance.measure)"
      />
    </div>
    <div
      v-if="measuresLeft.length > 0"
    >
      <Button
        :icon="PrimeIcons.PLUS_CIRCLE"
        severity="secondary"
        label="Add Starting Balance"
        size="small"
        outlined
        text
        @click="handleAddStartingBalanceClick"
      />
    </div>
  </div>
</template>
