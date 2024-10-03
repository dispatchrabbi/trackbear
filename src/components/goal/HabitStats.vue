<script setup lang="ts">
import { computed, defineProps } from 'vue';

import { Goal } from 'src/lib/api/goal.ts';
import { Tally } from 'src/lib/api/tally.ts';

import { analyzeStreaksForHabit } from 'server/lib/models/goal.ts';

import StatTile from 'src/components/goal/StatTile.vue';
import { commaify } from 'src/lib/number.ts';
import { GoalHabitParameters, GOAL_CADENCE_UNIT_INFO } from 'server/lib/models/goal.ts';

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

const periodUnit = computed(() => {
  const params = props.goal.parameters as GoalHabitParameters;
  return params.cadence.unit;
});

const averageStreak = computed(() => {
  const streaks = habitStats.value.streaks.all.map(streak => streak.length).filter(streak => streak !== 0);
  if(streaks.length > 0) {
    const average = streaks.reduce((total, streak) => total + streak, 0) / streaks.length;
    return average.toFixed(2);
  } else {
    return 0;
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
      top-legend="you're currently at"
      :highlight="commaify(habitStats.streaks.current.length)"
      :suffix="GOAL_CADENCE_UNIT_INFO[periodUnit].label[habitStats.streaks.current.length === 1 ? 'singular' : 'plural']"
      bottom-legend="in a row"
    />
    <StatTile
      top-legend="your record is"
      :highlight="commaify(habitStats.streaks.longest.length)"
      :suffix="GOAL_CADENCE_UNIT_INFO[periodUnit].label[habitStats.streaks.longest.length === 1 ? 'singular' : 'plural']"
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

<style>
.habit-stats > div {
  flex: 1 1 20%;
}
</style>
