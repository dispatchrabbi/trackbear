<script setup lang="ts">
import { computed, defineProps } from 'vue';

import { Tally } from 'src/lib/api/tally.ts';

import { compileTallies } from 'src/lib/tally.ts';
import { formatDate } from 'src/lib/date.ts';
import type { TargetGoal } from 'server/lib/models/goal/types';

import GoalCard from 'src/components/dashboard/GoalCard.vue';
import TargetMeter from 'src/components/goal/TargetMeter.vue';

const props = defineProps<{
  goal: TargetGoal;
  tallies: Tally[];
}>();

const targetStats = computed(() => {
  const today = formatDate(new Date());

  const compiled = compileTallies(props.tallies);

  const lastTally = compiled[compiled.length - 1];
  const lastTallyIsToday = lastTally.date === today;

  const measure = props.goal.parameters.threshold.measure;

  return {
    measure: measure,
    goal: props.goal.parameters.threshold.count,
    isComplete: lastTally.total[measure] >= props.goal.parameters.threshold.count,
    today: lastTallyIsToday ? lastTally.count[measure] : 0,
    beforeToday: lastTallyIsToday ? lastTally.total[measure] - lastTally.count[measure] : lastTally.total[measure],
  };
});
</script>

<template>
  <GoalCard
    :goal="props.goal"
  >
    <template #comment>
      <div
        v-if="targetStats.isComplete"
        :class="[
          'px-2 py-1 rounded-full text-sm font-normal',
          'bg-accent-500 dark:bg-accent-400 text-surface-0 dark:text-surface-950',
        ]"
      >
        Complete!
      </div>
    </template>
    <template #content>
      <TargetMeter
        :measure="targetStats.measure"
        :goal="targetStats.goal"
        :past="targetStats.beforeToday"
        :today="targetStats.today"
      />
    </template>
  </GoalCard>
</template>
