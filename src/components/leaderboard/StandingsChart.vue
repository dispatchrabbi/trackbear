<script setup lang="ts">
import { computed } from 'vue';

import { differenceInCalendarDays } from 'date-fns';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';
import type { TallyMeasure } from 'server/lib/models/tally/consts';

import { formatDate, parseDateString } from "src/lib/date.ts";
import { formatCount } from 'src/lib/tally.ts';
import { formatPercent } from 'src/lib/number.ts';
import { normalizeTallies, accumulateTallies, determineChartStartDate, determineChartEndDate } from '../chart/chart-functions';

const props = defineProps<{
  leaderboard: Leaderboard;
  participants: Participant[];
  measure: TallyMeasure | 'percent';
}>();

const getMeasure = function(participant: Participant): TallyMeasure {
  return props.measure === 'percent' ? participant.goal.measure : props.measure;
};

const getGoalCount = function(participant) {
  return props.measure === 'percent' ? participant.goal.count : props.leaderboard.goal[props.measure];
};

const hasGoal = computed(() => {
  return (props.measure === 'percent') || props.measure in props.leaderboard.goal;
});

const hasPar = computed(() => {
  return (props.measure === 'percent') || (props.measure in props.leaderboard.goal && !props.leaderboard.fundraiserMode);
});

const cmpByRawProgress = function (a, b) {
  return a.progress === b.progress ?
    (a.lastActivity < b.lastActivity ? -1 : a.lastActivity > b.lastActivity ? 1 : 0) :
    (b.progress - a.progress);
}

const cmpByRawPercent = function(a, b) {
  return a.percentRaw === b.percentRaw ?
    (a.lastActivity < b.lastActivity ? -1 : a.lastActivity > b.lastActivity ? 1 : 0) :
    (a.percentRaw > b.percentRaw ? -1 : a.percentRaw < b.percentRaw ? 1 : 0);
}

// const rankBy(objs, rankField: string, idField: string): Record<string, number> {
//   const sorted = objs.sort((a, b) => b[rankField] - a[rankField]);

// }

type StandingsDataRow = {
  uuid: string;
  position: number;
  // positionChange: number;
  displayName: string;
  // avatar: string;
  progress: number;
  measure: TallyMeasure;
  versusPar: number | null;
  goal: number;
  percentRaw: number;
  percent: string;
  lastActivity: string;
};

const tallyDates = computed(() => {
  const [ earliestDate, latestDate ] = props.participants
    .flatMap(participant => participant.tallies
      .filter(tally => tally.measure === getMeasure(participant))
      .map(tally => tally.date)
    )
    .reduce(([earliest, latest], date) => {
      return [
        earliest === null ? date : date < earliest ? date : earliest,
        latest === null ? date : date > latest ? date : latest,
      ];
    }, [ null, null ]);

    return { earliest: earliestDate, latest: latestDate };
});

const startDate = computed(() => determineChartStartDate(tallyDates.value.earliest, props.leaderboard.startDate));
const endDate = computed(() => determineChartEndDate(tallyDates.value.latest, props.leaderboard.endDate));
const daysBetween = computed(() => (
  differenceInCalendarDays(parseDateString(endDate.value), parseDateString(startDate.value)) + 1 // +1 to include both start and end dates
));
const daysAlong = computed(() => (
  differenceInCalendarDays(new Date(), parseDateString(startDate.value)) + 1 // +1 to include both start and end dates
));

const tableData = computed(() => {
  const data: StandingsDataRow[] = [];

  const getPar = function(participant) {
    if(!hasPar.value) { return null; }

    const goalCount = getGoalCount(participant);
    if(props.leaderboard.endDate === null) {
      return goalCount;
    } else {
      // if we're past the end, par is just the goal; otherwise, do the intermediate calculation
      return daysAlong.value >= daysBetween.value ? goalCount : Math.ceil((goalCount / daysBetween.value) * daysAlong.value);
    }
  };

  const today = formatDate(new Date());

  for(const participant of props.participants) {
    const normalizedTallies = normalizeTallies(participant.tallies.filter(tally => tally.measure === getMeasure(participant)));
    const accumulatedTallies = accumulateTallies(normalizedTallies);

    const lastRelevantTally = accumulatedTallies.findLast(tally => tally.date <= today);
    if(lastRelevantTally) {
      data.push({
        uuid: participant.uuid,
        position: 0,
        displayName: participant.displayName,
        // avatar: participant.avatar,
        progress: lastRelevantTally.accumulated,
        measure: getMeasure(participant),
        versusPar: hasPar.value ? lastRelevantTally.accumulated - getPar(participant) : null,
        goal: getGoalCount(participant),
        percentRaw: lastRelevantTally.accumulated / getGoalCount(participant),
        percent: formatPercent(lastRelevantTally.accumulated, getGoalCount(participant)) + '%',
        lastActivity: lastRelevantTally.date,
      });
    }
  }

  const sorted = data.sort(props.measure === 'percent' ? cmpByRawPercent : cmpByRawProgress);
  
  // calculate the position for each participant
  // forEach, not map, because I need access to the modified previous elements
  // TODO: genericize this so I can use it for "yesterday's position" (and thus position change)
  sorted.forEach((el, ix, arr) => {
    let position = ix + 1;
    
    if(ix !== 0) {
      const prevEl = arr[ix - 1];
      const total = props.measure === 'percent' ? el.percent : el.progress;
      const prevTotal = props.measure === 'percent' ? prevEl.percent : prevEl.progress;
      if(total === prevTotal) {
        const lastActivity = el.lastActivity;
        const prevLastActivity = prevEl.lastActivity;
        if(lastActivity === prevLastActivity) {
          position = prevEl.position;
        }
      }
    }

    el.position = position;
  });

  return sorted;
});
</script>

<template>
  <h1>It Works!</h1>
</template>