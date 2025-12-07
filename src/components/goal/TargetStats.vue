<script setup lang="ts">
import { computed } from 'vue';
import { differenceInCalendarDays } from 'date-fns';

import type { Goal } from 'src/lib/api/goal.ts';
import { formatDate } from 'src/lib/date.ts';
import { type TargetGoalParameters } from 'server/lib/models/goal/types';
import type { Tally } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { TALLY_MEASURE_INFO, compileTallies, formatCount } from 'src/lib/tally.ts';

import SubsectionTitle from '../layout/SubsectionTitle.vue';
import StatLine from './StatLine.vue';

import { parseDateString } from 'src/lib/date.ts';
import { commaifyWithPrecision, formatPercent, roundAwayFromZero } from 'src/lib/number.ts';
import FullCircleGauge from '../stats/FullCircleGauge.vue';
import { getRandomElement } from 'src/lib/arr';
import { type NonEmptyArray } from 'server/lib/validators';

const props = defineProps<{
  goal: Goal;
  tallies: Tally[];
}>();

const measure = computed(() => {
  const params = props.goal.parameters as TargetGoalParameters;
  return params.threshold.measure;
});

const isSmallMeasure = computed(() => {
  return [TALLY_MEASURE.CHAPTER, TALLY_MEASURE.PAGE, TALLY_MEASURE.SCENE].includes(measure.value);
});

const thresholdCount = computed(() => {
  const params = props.goal.parameters as TargetGoalParameters;
  return params.threshold.count;
});

const compiledTallies = computed(() => {
  const compiled = compileTallies(props.tallies);
  return compiled;
});

const overallStats = computed(() => {
  const today = formatDate(new Date());

  const stats = {
    totalCount: 0,
    isComplete: 0 >= thresholdCount.value,
    todayCount: 0,
    beforeTodayCount: 0,
  };

  if(compiledTallies.value.length > 0) {
    const lastTally = compiledTallies.value.at(-1);
    const lastTallyIsToday = lastTally?.date === today;

    stats.totalCount = lastTally!.total[measure.value];
    stats.isComplete = lastTally!.total[measure.value] >= thresholdCount.value;
    stats.todayCount = lastTallyIsToday ? lastTally.count[measure.value] : 0;
    stats.beforeTodayCount = lastTallyIsToday ? lastTally.total[measure.value] - lastTally.count[measure.value] : lastTally!.total[measure.value];
  }

  return stats;
});

// this is the number of days since the start of the target, including today
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

// this is the number of days until the end date of the target, not including today
const daysToGo = computed(() => {
  if(props.goal.endDate === null) {
    return Infinity;
  }

  const today = new Date();
  const endDate = parseDateString(props.goal.endDate);

  const days = differenceInCalendarDays(endDate, today);
  return days;
});

// this is the number of days total in the target
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

// how much further there is to go (or 0 if the goal has been met)
const totalToGo = computed(() => {
  if(thresholdCount.value < 0) {
    return Math.min(thresholdCount.value - overallStats.value.totalCount, 0);
  } else {
    return Math.max(thresholdCount.value - overallStats.value.totalCount, 0);
  }
});

// how much you've done per day, including today
const paceSoFar = computed(() => {
  if(overallStats.value.totalCount === 0) {
    return 0;
  } else if(daysSoFar.value === 0) {
    return 0;
  } else {
    const precision = isSmallMeasure.value ? 2 : 0;
    return +(overallStats.value.totalCount / daysSoFar.value).toFixed(precision);
  }
});

// how many days it'll take you to get to your goal at your current pace
const daysAtPace = computed(() => {
  if(paceSoFar.value === 0) {
    return Infinity;
  } else {
    return roundAwayFromZero(totalToGo.value / paceSoFar.value);
  }
});

// how much you have to do every day in order to hit your goal (not counting any progress today)
const paceToGo = computed(() => {
  if(totalToGo.value === 0) {
    return 0;
  } else if(daysToGo.value === Infinity) {
    return 0;
  } else {
    // don't count any progress made today, so that this stat can be used to answer
    // the question "how many words do I need to write today to stay on pace?"
    const totalToGoNotCountingToday = thresholdCount.value - overallStats.value.beforeTodayCount;
    const daysToGoCountingToday = daysToGo.value + 1;

    const precision = isSmallMeasure.value ? 2 : 0;
    return +(totalToGoNotCountingToday / daysToGoCountingToday).toFixed(precision);
  }
});

const yetToDoToday = computed(() => {
  if(props.goal.endDate === null) {
    return roundAwayFromZero(paceSoFar.value - overallStats.value.todayCount);
  } else {
    return roundAwayFromZero(paceToGo.value - overallStats.value.todayCount);
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
  { description: 'Which on Mars would be', factor: 1.02749125, precision: 2, counter: ['Sol', 'Sols'] },
  { description: 'Which works out to', factor: 1 / 14, precision: 2, counter: ['fortnight', 'fortnights'] },
  { description: 'During which your nails will grow', factor: 0.12, precision: 2, counter: ['mm', 'mm'] },
  { description: 'During which the Earth will travel', factor: 2572992, precision: 0, counter: ['km', 'km'] },
  { description: 'During which you could walk about', factor: 3.18 * 24, precision: 2, counter: ['mile', 'miles'] },
  // { description: 'During which you could walk about', factor: 5.12 * 24, precision: 2, counter: ['km', 'km'] },
  // { description: 'During which Usain Bolt could run', factor: 27.79 * 24, precision: 2, counter: ['mile', 'miles'] },
  { description: 'During which Usain Bolt could run', factor: 44.72 * 24, precision: 2, counter: ['km', 'km'] },
  { description: 'Enough time to play Free Bird', factor: 86400 / 548, precision: 0, counter: ['time', 'times'] },
  // { description: 'Enough time to listen to Bohemian Rhapsody', factor: 86400 / 355, precision: 0, counter: ['time', 'times'] },
];
const funPaceFact = computed(() => {
  const fact = getRandomElement(FUN_FACTS as NonEmptyArray<typeof FUN_FACTS[number]>);

  const daysAtPace = totalToGo.value / paceSoFar.value;
  const funPace = daysAtPace * fact.factor;
  const counter = funPace === 1 ? fact.counter[0] : fact.counter[1];

  return {
    description: fact.description,
    stat: `${commaifyWithPrecision(funPace, fact.precision)} ${counter}`,
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

const finishedDailyPace = computed(() => {
  const precision = isSmallMeasure.value ? 2 : 0;
  return +(overallStats.value.totalCount / totalDays.value).toFixed(precision);
});

const daysToHitGoal = computed(() => {
  if(!overallStats.value.isComplete) {
    return Infinity;
  }

  if(compiledTallies.value.length === 0) {
    return 0;
  }

  const completingTally = compiledTallies.value.find(tally => tally.total[measure.value] >= thresholdCount.value)!;
  const completionDate = completingTally.date;

  const startDate = props.goal.startDate ?? compiledTallies.value[0].date;

  return differenceInCalendarDays(completionDate, startDate) + 1;
});
</script>

<template>
  <div class="flex flex-col md:flex-row flex-wrap md:flex-nowrap">
    <div>
      <SubsectionTitle title="Overall Progress" />
      <div class="flex gap-4 p-2">
        <div class="w-32 h-32">
          <FullCircleGauge
            :max="thresholdCount"
            :value="overallStats.totalCount"
          >
            <div class="flex flex-col text-center">
              <div>{{ formatCount(overallStats.totalCount, measure) }}</div>
              <div>{{ formatPercent(overallStats.totalCount, thresholdCount) }}%</div>
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
            :stat="`${daysToHitGoal} day${daysToHitGoal === 1 ? '' : 's'}`"
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
