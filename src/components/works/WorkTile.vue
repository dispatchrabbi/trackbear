<script setup lang="ts">
import { defineProps } from 'vue';
import type { WorkWithTotals } from 'src/lib/api/work.ts';
import { WORK_PHASE } from 'server/lib/entities/work';
import { TALLY_MEASURE_INFO } from 'src/lib/tally';

const props = defineProps<{
  work: WorkWithTotals;
}>();

import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { PrimeIcons } from 'primevue/api';

const WORK_PHASE_TAG_COLORS = {
  [WORK_PHASE.DRAFTING]: 'primary',
  [WORK_PHASE.REVISING]: 'info',
  [WORK_PHASE.ON_HOLD]: 'warning',
  [WORK_PHASE.FINISHED]: 'success',
  [WORK_PHASE.ABANDONED]: 'danger',
};

</script>

<template>
  <Card
    :pt="{ content: { class: '!py-0' } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  >
    <template #title>
      <div class="flex gap-2">
        <div>{{ props.work.title }}</div>
        <!-- TODO: enable when these are implemented -->
        <!--
        <Tag
          :value="props.work.phase"
          :severity="WORK_PHASE_TAG_COLORS[props.work.phase]"
          :pt="{ root: { class: 'font-normal uppercase' } }"
          :pt-options="{ mergeSections: true, mergeProps: true }"
        />
        <div class="spacer flex-auto" />
        <Button
          :icon="PrimeIcons.STAR"
          text
          rounded
          aria-label="Star"
        />
      -->
      </div>
    </template>
    <template #content>
      <div class="flex gap-2">
        <div class="font-light italic grow">
          {{ work.description }}
        </div>
        <div
          v-for="(value, key) in props.work.totals"
          :key="key"
          class="total"
        >
          <span class="font-light"><span class="font-medium">{{ value }}</span> {{ TALLY_MEASURE_INFO[key].counter[Math.abs(value) === 1 ? 'singular' : 'plural'] }}</span>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.total::after {
  content: ' ▪︎'
}

.total:last-child::after {
  content: none;
}
</style>
