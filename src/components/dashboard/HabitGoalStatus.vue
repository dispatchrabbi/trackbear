<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { add } from 'date-fns';

import { Goal } from 'src/lib/api/goal.ts';
import { Tally } from 'src/lib/api/tally.ts';

import { analyzeHabitTallies } from 'src/lib/goal.ts';
import { formatDate, parseDateStringSafe } from 'src/lib/date.ts';

import HabitGauge from 'src/components/goal/HabitGauge.vue';

import Card from 'primevue/card';
import { GoalHabitParameters } from 'server/lib/models/goal.ts';

const props = defineProps<{
  goal: Goal,
  tallies: Tally[],
}>();

const habitStats = computed(() => {
  const params = props.goal.parameters as GoalHabitParameters;

  const now = new Date();
  const endDate = parseDateStringSafe(props.goal.endDate);
  const fivePeriodsAgo = formatDate(add(
    endDate === null ? now : (endDate < now ? endDate : now),
    { [params.cadence.unit + 's']: -5 * params.cadence.period })
  );

  const stats = analyzeHabitTallies(
    props.tallies,
    props.goal,
    props.goal.startDate ?? fivePeriodsAgo,
    props.goal.endDate ?? formatDate(now),
  );

  return stats;
});

const ranges = computed(() => habitStats.value.ranges.toReversed().slice(0, 5));
</script>

<template>
  <Card
    class="max-w-full"
    :pt="{ content: { class: 'py-0 px-5 md:px-6' } }"
  >
    <template #title>
      {{ props.goal.title }}
    </template>
    <template #content>
      <div class="flex overflow-x-auto">
        <HabitGauge
          v-for="range of ranges"
          :key="range.startDate"
          :range="range"
          :goal="props.goal"
        />
      </div>
    </template>
  </Card>
</template>
