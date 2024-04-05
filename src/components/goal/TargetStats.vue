<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { differenceInCalendarDays } from 'date-fns';

import type { Goal } from 'src/lib/api/goal.ts';
import { GoalTargetParameters } from 'server/lib/models/goal.ts';
import type { Tally } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import StatTile from './StatTile.vue';
import { formatDuration, parseDateString } from 'src/lib/date.ts';
import { compileTallies } from '../chart/chart-functions.ts';
import { commaify } from 'src/lib/number.ts';

const props = defineProps<{
  goal: Goal;
  tallies: Tally[];
}>();

const isTimeMeasure = computed(() => {
  const parameters = props.goal.parameters as GoalTargetParameters;
  return parameters.threshold.measure === TALLY_MEASURE.TIME;
});

const measureCounter = computed(() => {
  const parameters = props.goal.parameters as GoalTargetParameters;
  return TALLY_MEASURE_INFO[parameters.threshold.measure].counter;
});

const compiledTallies = computed(() => {
  const compiled = compileTallies(props.tallies);
  return compiled;
});

const daysSoFar = computed(() => {
  const today = new Date();

  if(props.goal.startDate) {
    const startDate = parseDateString(props.goal.startDate);
    return differenceInCalendarDays(today, startDate) + 1;
  } else if(compiledTallies.value.length === 0) {
    return 0;
  } else {
    const startDate = parseDateString(compiledTallies.value[0].date);
    return differenceInCalendarDays(today, startDate) + 1;
  }
});

const daysToGo = computed(() => {
  if(props.goal.endDate === null) {
    return Infinity;
  }

  const today = new Date();
  const endDate = parseDateString(props.goal.endDate);

  const days = differenceInCalendarDays(endDate, today);

  return days;
});

const totalSoFar = computed(() => {
  const parameters = props.goal.parameters as GoalTargetParameters;
  return compiledTallies.value[compiledTallies.value.length - 1].total[parameters.threshold.measure];
});

const totalToGo = computed(() => {
  const parameters = props.goal.parameters as GoalTargetParameters;
  return Math.max(parameters.threshold.count - totalSoFar.value, 0);
});

const paceSoFar = computed(() => {
  if(totalSoFar.value === 0) {
    return 0;
  } else if(daysSoFar.value === 0) {
    return totalSoFar.value;
  } else {
    return Math.round(totalSoFar.value / daysSoFar.value);
  }
});

const daysAtPace = computed(() => {
  if(paceSoFar.value === 0) {
    return Infinity;
  } else {
    return Math.ceil(totalToGo.value / paceSoFar.value);
  }
});

const paceToGo = computed(() => {
  if(totalToGo.value === 0) {
    return 0;
  } else if(daysToGo.value === Infinity) {
    return 0;
  } else {
    return Math.round(totalToGo.value / daysToGo.value);
  }
});

const paceEval = computed(() => {
  const paceRatio = paceToGo.value / paceSoFar.value;

  if(daysSoFar.value < 3) {
    return 'you got this!';
  } else if(paceToGo.value === 0) {
    return 'phew!';
  } else if(paceRatio < 1.1) {
    return 'no sweat!';
  } else if(paceRatio < 1.6) {
    return 'you got this!';
  } else if(paceRatio < 2) {
    return 'ramp it up!';
  } else {
    return 'good luck!';
  }
});

const paceToGoOnMars = computed(() => {
  if(totalToGo.value === 0) {
    return 0;
  } else if(daysToGo.value === Infinity) {
    return 0;
  } else {
    return Math.round((totalToGo.value * 24) / (daysToGo.value * 24.5));
  }
});
</script>

<template>
  <div class="target-stats flex flex-wrap justify-evenly gap-2">
    <StatTile
      top-legend="you are"
      :highlight="commaify(daysSoFar)"
      :suffix="daysSoFar === 1 ? 'day' : 'days'"
      bottom-legend="into your goal"
    />
    <StatTile
      top-legend="you've logged"
      :highlight="isTimeMeasure ? formatDuration(totalSoFar) : commaify(totalSoFar)"
      :suffix="isTimeMeasure ? null : measureCounter[totalSoFar === 1 ? 'singular' : 'plural']"
      bottom-legend="so far"
    />
    <StatTile
      top-legend="on average, that's"
      :highlight="isTimeMeasure ? formatDuration(paceSoFar) : commaify(paceSoFar)"
      :suffix="isTimeMeasure ? null : measureCounter[paceSoFar === 1 ? 'singular' : 'plural']"
      bottom-legend="per day"
    />
    <StatTile
      top-legend="at that pace, after"
      :highlight="daysAtPace === Infinity ? 'ETERNITY' : commaify(daysAtPace)"
      :suffix="daysAtPace === Infinity ? null : daysAtPace === 1 ? 'day' : 'days'"
      bottom-legend="you'll hit your goal"
    />
    <StatTile
      top-legend="you have"
      :highlight="daysToGo === Infinity ? 'FOREVER' : commaify(daysToGo)"
      :suffix="daysToGo === Infinity ? null : daysToGo === 1 ? 'day' : 'days'"
      bottom-legend="until your deadline"
    />
    <StatTile
      top-legend="you need to log"
      :highlight="isTimeMeasure ? formatDuration(totalToGo) : commaify(totalToGo)"
      :suffix="isTimeMeasure ? null : measureCounter[totalToGo === 1 ? 'singular' : 'plural']"
      bottom-legend="to hit your goal"
    />
    <StatTile
      top-legend="on average, that's"
      :highlight="isTimeMeasure ? formatDuration(paceToGo) : commaify(paceToGo)"
      :suffix="isTimeMeasure ? null : measureCounter[paceToGo === 1 ? 'singular' : 'plural']"
      :bottom-legend="`per day (${paceEval})`"
    />
    <StatTile
      top-legend="but on Mars it'd be"
      :highlight="isTimeMeasure ? formatDuration(paceToGoOnMars) : commaify(paceToGoOnMars)"
      :suffix="isTimeMeasure ? null : measureCounter[paceToGoOnMars === 1 ? 'singular' : 'plural']"
      bottom-legend="per sol (Martian day)"
    />
  </div>
</template>

<style scoped>
.target-stats > div {
  flex: 1 1 20%;
}
</style>
