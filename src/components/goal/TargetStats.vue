<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { differenceInCalendarDays } from 'date-fns';

import type { Goal } from 'src/lib/api/goal.ts';
import { formatDate } from 'src/lib/date.ts';
import { GoalTargetParameters } from 'server/lib/models/goal.ts';
import type { Tally } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';
import { TALLY_MEASURE_INFO, compileTallies, formatCount } from 'src/lib/tally.ts';

import SubsectionTitle from '../layout/SubsectionTitle.vue';
import StatLine from './StatLine.vue';

import StatTile from './StatTile.vue';
import { formatDuration, parseDateString } from 'src/lib/date.ts';
import { commaifyWithPrecision, formatPercent } from 'src/lib/number.ts';
import FullCircleGauge from '../stats/FullCircleGauge.vue';
import { getRandomElement } from 'src/lib/arr';
import { NonEmptyArray } from 'server/lib/validators';

const props = defineProps<{
  goal: Goal;
  tallies: Tally[];
}>();

const measure = computed(() => {
  const params = props.goal.parameters as GoalTargetParameters;
  return params.threshold.measure;
});

const compiledTallies = computed(() => {
  const compiled = compileTallies(props.tallies);
  return compiled;
});

const overallStats = computed(() => {
  const params = props.goal.parameters as GoalTargetParameters;
  const today = formatDate(new Date());

  const lastTally = compiledTallies.value.at(-1);
  const lastTallyIsToday = lastTally?.date === today;

  return {
    goalCount: params.threshold.count,
    totalCount: lastTally.total[measure.value],
    isComplete: lastTally.total[measure.value] >= params.threshold.count,
    todayCount: lastTallyIsToday ? lastTally.count[measure.value] : 0,
    beforeTodayCount: lastTallyIsToday ? lastTally.total[measure.value] - lastTally.count[measure.value] : lastTally.total[measure.value],
  };
});

const isSmallMeasure = computed(() => {
  return [TALLY_MEASURE.CHAPTER, TALLY_MEASURE.PAGE, TALLY_MEASURE.SCENE].includes(measure.value);
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

const totalDays = computed(() => {
  if(props.goal.endDate === null) {
    return Infinity;
  }

  const endDate = parseDateString(props.goal.endDate);
  if(props.goal.startDate) {
    const startDate = parseDateString(props.goal.startDate);
    return differenceInCalendarDays(endDate, startDate) + 1;
  } else if(compiledTallies.value.length === 0) {
    return 0;
  } else {
    const startDate = parseDateString(compiledTallies.value[0].date);
    return differenceInCalendarDays(endDate, startDate) + 1;
  }
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
    const precision = isSmallMeasure.value ? 2 : 0;
    // yeah, yeah, this will be a bit inaccurate. That's okay.
    return +(totalSoFar.value / daysSoFar.value).toFixed(precision);
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
    const precision = isSmallMeasure.value ? 2 : 0;
    // yeah, yeah, this will be a bit inaccurate. That's okay.
    const toGoNotCountingToday = overallStats.value.goalCount - overallStats.value.beforeTodayCount;
    return +(toGoNotCountingToday / (daysToGo.value + 1)).toFixed(precision);
  }
});

const yetToDoToday = computed(() => {
  if(props.goal.endDate === null) {
    return Math.ceil(paceSoFar.value - overallStats.value.todayCount);
  } else {
    return Math.ceil(paceToGo.value - overallStats.value.todayCount);
  }
});

const paceEval = computed(() => {
  const paceRatio = yetToDoToday.value / paceSoFar.value;

  if(daysSoFar.value < 3) {
    return 'get it going!';
  } else if(yetToDoToday.value <= 0) {
    return 'phew!';
  } else if(paceRatio < 0.1) {
    return 'almost there!';
  } else if(paceRatio < 0.33) {
    return 'you got this!';
  } else if(paceRatio < 0.67) {
    return 'keep on going!';
  } else if(paceRatio < 0.9) {
    return 'good luck!';
  } else {
    return 'bear down!';
  }
});

const FUN_FACTS = [
  { description: 'Which on Mars would be', factor: 1, precision: 2, counter: ['Sol', 'Sols'] },
  { description: 'During which your nails will grow', factor: 0.12, precision: 2, counter: ['mm', 'mm'] },
  { description: 'During which the Earth will travel', factor: 2572992, precision: 0, counter: ['km', 'km'] },
];
const funPaceFact = computed(() => {
  const fact = getRandomElement(FUN_FACTS as NonEmptyArray<typeof FUN_FACTS[number]>);
  
  const daysAtPace = totalToGo.value / paceSoFar.value;
  const num = daysAtPace * fact.factor;
  const counter = num === 1 ? fact.counter[0] : fact.counter[1];

  return {
    description: fact.description,
    stat: `${commaifyWithPrecision(num, fact.precision)} ${counter}`,
  };
});

const isGoalFinished = computed(() => {
  if(props.goal.endDate === null) {
    return overallStats.value.isComplete;
  } else {
    const today = new Date();
    return props.goal.endDate < formatDate(today);
  }
});

const finishedTallies = computed(() => {
  if(!isGoalFinished.value) {
    return [];
  }

  const completingTally = compiledTallies.value.find(tally => tally.total[measure.value] >= overallStats.value.goalCount);
  if(completingTally) {
    return compiledTallies.value.filter(tally => tally.date <= completingTally.date);
  } else {
    return compiledTallies.value;
  }
});

const totalFinishedDays = computed(() => {
  const startDate = props.goal.startDate ?? finishedTallies.value[0].date;
  const endDate = props.goal.endDate ?? finishedTallies.value.at(-1).date;

  return differenceInCalendarDays(endDate, startDate) + 1;
});

const finishedDailyPace = computed(() => {
  if(!isGoalFinished.value) {
    return NaN;
  }

  const precision = isSmallMeasure.value ? 2 : 0;
  // yeah, yeah, this will be a bit inaccurate. That's okay.
  return +(finishedTallies.value.at(-1).total[measure.value] / totalFinishedDays.value).toFixed(precision);
});
</script>

<template>
  <div class="flex flex-col md:flex-row flex-wrap md:flex-nowrap">
    <div>
      <SubsectionTitle title="Overall Progress" />
      <div class="flex gap-4 p-2">
        <div class="w-32 h-32">
          <FullCircleGauge
            :max="overallStats.goalCount"
            :value="overallStats.totalCount"
          >
            <div class="flex flex-col text-center">
              <div>{{ formatCount(overallStats.totalCount, measure) }}</div>
              <div>{{ formatPercent(overallStats.totalCount, overallStats.goalCount) }}%</div>
            </div>
          </FullCircleGauge>
        </div>
        <div
          v-if="!isGoalFinished"
          class="flex flex-col gap-2"
        >
          <StatLine
            :description="`${TALLY_MEASURE_INFO[measure].counter.plural} left to go`"
            :stat="`${formatCount(totalToGo, measure)}`"
          />
          <StatLine
            description="Your average pace so far is"
            :stat="`${formatCount(paceSoFar, measure)} per day`"
          />
          <StatLine
            v-if="!overallStats.isComplete"
            description="So you'll hit your goal after"
            :stat="daysAtPace === Infinity ? 'ETERNITY' : `${daysAtPace} day${daysAtPace === 1 ? '' : 's'}`"
          />
          <StatLine
            v-if="!overallStats.isComplete"
            :description="funPaceFact.description"
            :stat="funPaceFact.stat"
          />
        </div>
        <div
          v-if="isGoalFinished"
          class="flex flex-col gap-2"
        >
          <StatLine
            :description="`Total ${TALLY_MEASURE_INFO[measure].counter.plural}`"
            :stat="`${formatCount(overallStats.totalCount, measure)}`"
          />
          <StatLine
            description="Your average pace was"
            :stat="`${formatCount(finishedDailyPace, measure)} per day`"
          />
          <StatLine
            v-if="overallStats.isComplete"
            description="You hit your goal after"
            :stat="`${totalFinishedDays} day${totalFinishedDays === 1 ? '' : 's'}`"
          />
        </div>
      </div>
    </div>
    <div
      v-if="!isGoalFinished"
    >
      <SubsectionTitle title="Today's Progress" />
      <div class="flex gap-4 p-2">
        <div class="w-32 h-32">
          <FullCircleGauge
            :max="paceToGo"
            :value="overallStats.todayCount"
            :text="formatCount(overallStats.todayCount, measure)"
          />
        </div>
        <div class="flex flex-col gap-2">
          <StatLine
            description="Today is"
            :stat="`Day ${daysSoFar} of ${totalDays !== Infinity ? totalDays : 'your goal'}`"
          />
          <StatLine
            v-if="totalDays !== Infinity"
            description="Pace needed to hit your goal"
            :stat="`${formatCount(paceToGo, measure)} per day`"
          />
          <StatLine
            :description="`Versus your average, you ${yetToDoToday > 0 ? 'have' : 'are'}`"
            :stat="`${formatCount(Math.abs(yetToDoToday), measure)} ${yetToDoToday > 0 ? 'to go' : 'ahead'} (${paceEval})`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.target-stats > div {
  flex: 1 1 20%;
}
</style>
