<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { Goal, starGoal } from 'src/lib/api/goal.ts';
import { GOAL_TYPE } from 'server/lib/models/goal.ts';

const props = defineProps<{
  goal: Goal;
}>();

const emit = defineEmits(['goal:star']);

import Card from 'primevue/card';
import Tag from 'primevue/tag';
import { PrimeIcons } from 'primevue/api';
import { describeGoal } from 'src/lib/goal.ts';

const GOAL_TYPE_TAG_COLORS = {
  [GOAL_TYPE.TARGET]: 'warning',
  [GOAL_TYPE.HABIT]: 'success',
};

const isStarLoading = ref<boolean>(false);
async function onStarClick() {
  isStarLoading.value = true;

  const newStarVal = !props.goal.starred;
  await starGoal(props.goal.id, newStarVal);
  isStarLoading.value = false;

  emit('goal:star', { id: props.goal.id, starred: newStarVal });
}

</script>

<template>
  <Card
    :pt="{ content: { class: '!py-0' } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  >
    <template #title>
      <div class="flex gap-2 items-baseline">
        <span
          :class="[
            isStarLoading ? PrimeIcons.SPINNER + ' pi-spin' : props.goal.starred ? PrimeIcons.STAR_FILL : PrimeIcons.STAR,
            'text-primary-500 dark:text-primary-400'
          ]"
          @click.prevent="onStarClick"
        />
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
      <div class="flex flex-col md:flex-row gap-2">
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
