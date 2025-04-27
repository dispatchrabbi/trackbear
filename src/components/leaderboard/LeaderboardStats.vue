<script setup lang="ts">
import { computed } from 'vue';

import type { Participant } from 'src/lib/api/leaderboard';
import { TallyMeasure } from 'server/lib/models/tally/consts';
import { formatCountValue, formatCountCounter } from 'src/lib/tally.ts';

import StatTile from '../goal/StatTile.vue';

const props = defineProps<{
  participants: Participant[];
  measure: TallyMeasure;
}>();

const grandTotal = computed(() => {
  let grandTotal = 0;

  for(const participant of props.participants) {
    for(const tally of participant.tallies) {
      if(tally.measure === props.measure) {
        grandTotal += tally.count;
      }
    }
  }

  return grandTotal;
});

</script>

<template>
  <StatTile
    class="mb-2"
    top-legend="Your combined total is"
    :highlight="formatCountValue(grandTotal, props.measure)"
    :suffix="formatCountCounter(grandTotal, props.measure)"
  />
</template>