<script setup lang="ts">
import { computed } from 'vue';
import { type Day } from 'date-fns';

import type { HabitGoal } from 'server/lib/models/goal/types';
import { type Tally } from 'src/lib/api/tally.ts';

import { analyzeStreaksForHabit, type HabitAnalysis } from 'server/lib/models/goal/helpers';

import StatTile from 'src/components/goal/StatTile.vue';
import { commaify } from 'src/lib/number.ts';
import { type HabitGoalParameters } from 'server/lib/models/goal/types';
import { GOAL_CADENCE_UNIT_INFO } from 'server/lib/models/goal/consts';

const props = withDefaults(defineProps<{
  goal: HabitGoal;
  tallies: Tally[];
  weekStartsOn?: Day;
}>(), {
  weekStartsOn: 0, // Sunday
});

const habitStats = computed<HabitAnalysis>(() => {
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

const periodUnit = computed(() => {
  const params = props.goal.parameters as HabitGoalParameters;
  return params.cadence.unit;
});

const currentStreak = computed(() => {
  return habitStats.value.streaks.current ?? [];
});

const longestStreak = computed(() => {
  return habitStats.value.streaks.longest ?? [];
});

// TODO: Should this be Math.floor(average)?
const averageStreak = computed(() => {
  const streaks = habitStats.value.streaks.all.map(streak => streak.length).filter(streak => streak !== 0);
  if(streaks.length > 0) {
    const average = streaks.reduce((total, streak) => total + streak, 0) / streaks.length;
    return average.toFixed(2);
  } else {
    return '0';
  }
});

const successPercent = computed(() => {
  const successes = habitStats.value.ranges.filter(range => range.isSuccess).length;
  const percent = 100 * successes / (habitStats.value.ranges.length || 1);

  return Math.round(percent);
});

</script>

<template>
  <div class="habit-stats flex flex-wrap justify-evenly gap-2">
    <StatTile
      v-if="habitStats.streaks.current !== null"
      top-legend="you're currently at"
      :highlight="commaify(currentStreak.length)"
      :suffix="GOAL_CADENCE_UNIT_INFO[periodUnit].label[currentStreak.length === 1 ? 'singular' : 'plural']"
      bottom-legend="in a row"
    />
    <StatTile
      top-legend="your record is"
      :highlight="commaify(longestStreak.length)"
      :suffix="GOAL_CADENCE_UNIT_INFO[periodUnit].label[longestStreak.length === 1 ? 'singular' : 'plural']"
      bottom-legend="in a row"
    />
    <StatTile
      top-legend="your typical streak is"
      :highlight="averageStreak"
      :suffix="GOAL_CADENCE_UNIT_INFO[periodUnit].label[(+averageStreak) === 1 ? 'singular' : 'plural']"
      bottom-legend="in a row"
    />
    <StatTile
      top-legend="you hit your goal"
      :highlight="successPercent"
      suffix="%"
      bottom-legend="of the time"
    />
  </div>
</template>

<style scoped>
.habit-stats > div {
  flex: 1 1 20%;
}
</style>
