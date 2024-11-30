<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { GoalWithAchievement, starGoal } from 'src/lib/api/goal.ts';

const props = defineProps<{
  goal: GoalWithAchievement;
}>();

const emit = defineEmits(['goal:star']);

import Card from 'primevue/card';
import Tag from 'primevue/tag';
import { PrimeIcons } from 'primevue/api';
import { describeGoal, getGoalProgress, GOAL_COMPLETION } from 'src/lib/goal.ts';

const GOAL_STATUS_TAG_COLORS = {
  [GOAL_COMPLETION.UPCOMING]: 'info',
  [GOAL_COMPLETION.ONGOING]: 'success',
  [GOAL_COMPLETION.ENDED]: 'secondary',
  [GOAL_COMPLETION.ACHIEVED]: 'accent',
};

const GOAL_STATUS_TAG_TEXT = {
  [GOAL_COMPLETION.UPCOMING]: 'Upcoming',
  [GOAL_COMPLETION.ONGOING]: 'Ongoing',
  [GOAL_COMPLETION.ENDED]: 'Ended',
  [GOAL_COMPLETION.ACHIEVED]: 'Achieved!',
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
          :value="GOAL_STATUS_TAG_TEXT[getGoalProgress(props.goal)]"
          :severity="GOAL_STATUS_TAG_COLORS[getGoalProgress(props.goal)]"
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
