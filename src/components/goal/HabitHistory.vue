<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { isWithinInterval, startOfDay, endOfDay, type Day } from 'date-fns';

import type { HabitGoal } from 'server/lib/models/goal/types';
import type { Tally } from 'src/lib/api/tally.ts';

import { analyzeStreaksForHabit } from 'server/lib/models/goal/helpers';
import { type HabitGoalParameters } from 'server/lib/models/goal/types';
import { parseDateStringSafe } from 'src/lib/date.ts';

import HabitGauge from 'src/components/goal/HabitGauge.vue';

const props = withDefaults(defineProps<{
  goal: HabitGoal;
  tallies: Tally[];
  weekStartsOn?: Day;
}>(), {
  weekStartsOn: 0, // Sunday
});

const habitStats = computed(() => {
  const parameters = props.goal.parameters as HabitGoalParameters;
  const stats = analyzeStreaksForHabit(
    props.tallies,
    parameters.cadence,
    parameters.threshold,
    props.goal.startDate,
    props.goal.endDate,
    props.weekStartsOn,
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
  <div class="flex flex-wrap justify-evenly md:justify-between gap-1">
    <HabitGauge
      v-for="range of ranges"
      :key="range.startDate"
      :range="range"
      :goal="props.goal"
      :highlight="rangeContainsToday(range)"
    />
  </div>
</template>
