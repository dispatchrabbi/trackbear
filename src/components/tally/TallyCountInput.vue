<script setup lang="ts">
import { computed, defineModel, defineProps } from 'vue';
import { roundTowardZero, decisiveSign } from 'src/lib/number.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

const model = defineModel<number | null>();
const props = defineProps<{
  id: string;
  measure: keyof typeof TALLY_MEASURE_INFO;
  invalid: boolean;
}>();

// hours and minutes are decomposed from a model value that's just minutes, and have to add back up to that
// why all the weird math for hours and minutes? we have to account for negative times
const hours = computed({
  get() {
    return model.value === null ? null : roundTowardZero(model.value / 60);
  },
  set(val) {
    // why are you here?
    if(props.measure !== TALLY_MEASURE.TIME) { return; }

    if(val === null && minutes.value === null) {
      model.value = null;
    } else {
      const minutesVal = minutes.value ?? 0;
      model.value = (val * 60) + (decisiveSign(val) * minutesVal);
    }
  }
});

const minutes = computed({
  get() {
    return model.value === null ? null : (Math.abs(model.value) % 60);
  },
  set(val) {
    // why are you here?
    if(props.measure !== TALLY_MEASURE.TIME) { return; }

    if(val === null && hours.value === null) {
      model.value = null;
    } else {
      const hoursVal = hours.value ?? 0;
      model.value = (hours.value * 60) + (decisiveSign(hoursVal) * val);
    }
  }
});

import InputGroup from 'primevue/inputgroup';
import InputNumber from 'primevue/inputnumber';
import InputGroupAddon from 'primevue/inputgroupaddon';

</script>

<template>
  <InputGroup>
    <template v-if="props.measure === TALLY_MEASURE.TIME">
      <InputNumber
        :id="props.id"
        v-model="hours"
        :pt="{ input: { root: { class: 'w-0 grow'} } }"
        :pt-options="{ mergeSections: true, mergeProps: true }"
        :invalid="props.invalid"
      />
      <InputGroupAddon class="!min-w-0">
        h
      </InputGroupAddon>
      <InputNumber
        :id="`${props.id}-minutes`"
        v-model="minutes"
        :pt="{ input: { root: { class: 'w-0 grow'} } }"
        :pt-options="{ mergeSections: true, mergeProps: true }"
        :invalid="props.invalid"
      />
      <InputGroupAddon class="!min-w-0">
        m
      </InputGroupAddon>
    </template>
    <template v-else>
      <InputNumber
        :id="props.id"
        v-model="model"
        :pt="{ input: { root: { class: 'w-0 grow'} } }"
        :pt-options="{ mergeSections: true, mergeProps: true }"
        :invalid="props.invalid"
      />
      <InputGroupAddon>{{ TALLY_MEASURE_INFO[props.measure].counter.plural }}</InputGroupAddon>
    </template>
  </InputGroup>
</template>
