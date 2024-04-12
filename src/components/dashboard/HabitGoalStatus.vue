<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { add, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

import { Goal } from 'src/lib/api/goal.ts';
import { Tally } from 'src/lib/api/tally.ts';

import { analyzeHabitTallies } from 'src/lib/goal.ts';
import { streakColors } from 'src/lib/tally.ts';
import { formatDate, parseDateStringSafe } from 'src/lib/date.ts';


import GoalCard from 'src/components/dashboard/GoalCard.vue';
import HabitGauge from 'src/components/goal/HabitGauge.vue';
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

function rangeContainsToday(range) {
  const now = new Date();
  const start = startOfDay(parseDateStringSafe(range.startDate));
  const end = endOfDay(parseDateStringSafe(range.endDate));

  return isWithinInterval(now, { start, end });
}

</script>

<template>
  <GoalCard
    :goal="props.goal"
  >
    <template #comment>
      <div
        v-if="habitStats.streaks.current > 1"
        :class="[ 'px-2 py-1 rounded-full text-sm font-normal', streakColors(habitStats.streaks.current) ]"
      >
        {{ habitStats.streaks.current }} in a row!
      </div>
    </template>
    <template #content>
      <div class="flex gap-1 overflow-x-auto">
        <HabitGauge
          v-for="range of ranges"
          :key="range.startDate"
          :range="range"
          :goal="props.goal"
          :highlight="rangeContainsToday(range)"
        />
      </div>
    </template>
  </GoalCard>
</template>
