<script setup lang="ts">
import { defineProps } from 'vue';
import type { Goal } from 'src/lib/api/goal.ts';
import { GOAL_TYPE, GOAL_CADENCE_UNIT } from 'server/lib/models/goal.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';

const props = defineProps<{
  goal: Goal;
}>();

import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { PrimeIcons } from 'primevue/api';
import { formatDuration } from 'src/lib/date.ts';
import { describeGoal } from 'src/lib/goal.ts';

const GOAL_TYPE_TAG_COLORS = {
  [GOAL_TYPE.TARGET]: 'warning',
  [GOAL_TYPE.HABIT]: 'success',
};

</script>

<template>
  <Card
    :pt="{ content: { class: '!py-0' } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  >
    <template #title>
      <div class="flex gap-2">
        <!-- TODO: enable when these are implemented -->
        <!-- <Button
          :icon="PrimeIcons.STAR"
          text
          rounded
          aria-label="Star"
        /> -->
        <div>{{ props.goal.title }}</div>
        <div class="spacer flex-auto" />
        <Tag
          :value="props.goal.type"
          :severity="GOAL_TYPE_TAG_COLORS[props.goal.type]"
          :pt="{ root: { class: 'font-normal uppercase' } }"
          :pt-options="{ mergeSections: true, mergeProps: true }"
        />
      </div>
    </template>
    <template #content>
      <div class="flex gap-2">
        <div class="font-light italic grow">
          {{ props.goal.description }}
        </div>
        <div>
          {{ describeGoal(props.goal) }}
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>

</style>
