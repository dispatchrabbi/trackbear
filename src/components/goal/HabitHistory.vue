<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

import { Goal } from 'src/lib/api/goal.ts';
import { Tally } from 'src/lib/api/tally.ts';

import { analyzeStreaksForHabit, GoalHabitParameters } from 'server/lib/models/goal.ts';
import { parseDateStringSafe } from 'src/lib/date.ts';

import HabitGauge from 'src/components/goal/HabitGauge.vue';

const props = defineProps<{
  goal: Goal,
  tallies: Tally[],
}>();

const habitStats = computed(() => {
  const parameters = props.goal.parameters as GoalHabitParameters;
  const stats = analyzeStreaksForHabit(
    props.tallies,
    parameters.cadence,
    parameters.threshold,
    props.goal.startDate,
    props.goal.endDate
  );

  return stats;
});

const ranges = computed(() => habitStats.value.ranges.toReversed());

function rangeContainsToday(range) {
  const now = new Date();
  const start = startOfDay(parseDateStringSafe(range.startDate));
  const end = endOfDay(parseDateStringSafe(range.endDate));

  return isWithinInterval(now, { start, end });
}

</script>

<template>
  <div class="flex flex-wrap gap-1">
    <HabitGauge
      v-for="range of ranges"
      :key="range.startDate"
      :range="range"
      :goal="props.goal"
      :highlight="rangeContainsToday(range)"
    />
  </div>
</template>
