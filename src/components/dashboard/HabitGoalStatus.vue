<script setup lang="ts">
import { computed } from 'vue';
import { isWithinInterval, startOfDay, endOfDay, type Day } from 'date-fns';

import { type Tally } from 'src/lib/api/tally.ts';

import { GOAL_CADENCE_UNIT_INFO } from 'server/lib/models/goal/consts';
import type { HabitGoal } from 'server/lib/models/goal/types';
import { analyzeStreaksForHabit, type HabitRange } from 'server/lib/models/goal/helpers';
import { streakColors } from 'src/lib/tally.ts';
import { formatDate, parseDateString, parseDateStringSafe } from 'src/lib/date.ts';
import { commaify, formatPercent } from 'src/lib/number.ts';

import GoalCard from 'src/components/dashboard/GoalCard.vue';
import HabitGauge from 'src/components/goal/HabitGauge.vue';
import StatTile from 'src/components/goal/StatTile.vue';

const props = withDefaults(defineProps<{
  goal: HabitGoal;
  tallies: Tally[];
  weekStartsOn?: Day;
}>(), {
  weekStartsOn: 0, // Sunday
});

const habitStats = computed(() => {
  const now = new Date();
  const goalEndDate = parseDateStringSafe(props.goal.endDate) ?? now;
  const endDate = now < goalEndDate ? now : goalEndDate;

  const stats = analyzeStreaksForHabit(
    props.tallies,
    props.goal.parameters.cadence,
    props.goal.parameters.threshold,
    props.goal.startDate,
    formatDate(endDate),
    props.weekStartsOn,
  );

  return stats;
});

const successfulRanges = computed<HabitRange[]>(() => {
  return habitStats.value.ranges.filter(range => range.isSuccess);
});

const currentRange = computed<HabitRange | null>(() => {
  const currentRanges = habitStats.value.ranges.filter(range => rangeContainsToday(range));
  if(currentRanges.length > 0) {
    return currentRanges[0];
  } else {
    return null;
  }
});

function rangeContainsToday(range: HabitRange) {
  const now = new Date();
  const start = startOfDay(parseDateString(range.startDate));
  const end = endOfDay(parseDateString(range.endDate));

  return isWithinInterval(now, { start, end });
}

</script>

<template>
  <GoalCard
    :goal="props.goal"
  >
    <template #comment>
      <div
        v-if="habitStats.streaks.current !== null && habitStats.streaks.current.length > 1"
        :class="[ 'px-2 py-1 rounded-full text-sm font-normal', streakColors(habitStats.streaks.current) ]"
      >
        {{ habitStats.streaks.current.length }} in a row!
      </div>
    </template>
    <template #content>
      <div class="habit-summary flex flex-wrap justify-evenly md:justify-start items-center gap-4 mb-4">
        <div
          v-if="currentRange !== null"
          class="current-progress"
        >
          <HabitGauge
            :goal="props.goal"
            :range="currentRange"
          />
        </div>
        <div
          v-if="habitStats.streaks.current !== null"
          class="current-streak"
        >
          <StatTile
            top-legend="Current streak"
            :highlight="commaify(habitStats.streaks.current.length)"
            :suffix="GOAL_CADENCE_UNIT_INFO[props.goal.parameters.cadence.unit].label[habitStats.streaks.current.length === 1 ? 'singular' : 'plural']"
            bottom-legend="in a row"
          />
        </div>
        <div
          v-if="habitStats.streaks.longest !== null"
          class="current-streak"
        >
          <StatTile
            top-legend="Longest streak"
            :highlight="commaify(habitStats.streaks.longest.length)"
            :suffix="GOAL_CADENCE_UNIT_INFO[props.goal.parameters.cadence.unit].label[habitStats.streaks.longest.length === 1 ? 'singular' : 'plural']"
            bottom-legend="in a row"
          />
        </div>
        <div class="success-rate">
          <StatTile
            :top-legend="`Success rate`"
            :highlight="`${formatPercent(successfulRanges.length, habitStats.ranges.length)}%`"
            :bottom-legend="`or ${successfulRanges.length} / ${habitStats.ranges.length}`"
          />
        </div>
      </div>
    </template>
  </GoalCard>
</template>
