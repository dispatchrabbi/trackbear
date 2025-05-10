<script setup lang="ts">
import { computed } from 'vue';

import type { Leaderboard, Participant } from 'src/lib/api/leaderboard';
import type { TallyMeasure } from 'server/lib/models/tally/consts.ts';

import { addDays, differenceInCalendarDays } from 'date-fns';

import { formatDate, parseDateString } from 'src/lib/date.ts';
import { formatCount } from 'src/lib/tally.ts';
import { formatPercent } from 'src/lib/number.ts';

import { normalizeTallies, accumulateTallies, determineChartStartDate, determineChartEndDate } from '../chart/chart-functions.ts';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import UserAvatar from 'src/components/UserAvatar.vue';

const props = defineProps<{
  leaderboard: Leaderboard;
  participants: Participant[];
  measure: TallyMeasure | 'percent';
}>();

const getMeasure = function(participant: Participant): TallyMeasure {
  return props.measure === 'percent' ? participant.goal.measure : props.measure;
};

const getGoalCount = function(participant: Participant) {
  return props.measure === 'percent' ? participant.goal.count : props.leaderboard.goal[props.measure];
};

const determineStartAndEndDates = function(leaderboard: Leaderboard, participants: Participant[]) {
  const dateSet = new Set<string>();
  for(const participant of participants) {
    const measure = getMeasure(participant);
    for(const tally of participant.tallies.filter(tally => tally.measure === measure)) {
      dateSet.add(tally.date);
    }
  }

  const sortedTallyDates = [...dateSet].sort();
  const [earliestDate, latestDate] = [sortedTallyDates.at(0) ?? null, sortedTallyDates.at(-1) ?? null];

  const startDate = determineChartStartDate(earliestDate, leaderboard.startDate);
  const endDate = determineChartEndDate(latestDate, leaderboard.endDate);
  const totalDays = differenceInCalendarDays(parseDateString(endDate), parseDateString(startDate)) + 1; // +1 because it's inclusive
  const daysAlong = differenceInCalendarDays(new Date(), parseDateString(startDate)) + 1; // +1 so that it counts today

  return {
    startDate,
    endDate,
    daysAlong,
    totalDays,
  };
};

const getParForToday = function(participant: Participant, daysAlong: number, totalDays: number) {
  const goalCount = getGoalCount(participant);
  if(props.leaderboard.endDate === null) {
    // if there's no end date, we can't do the calculation, so just use 100% of the goal
    return goalCount;
  } else if(daysAlong >= totalDays) {
    // if we're at or past the last day of the goal, return 100% of the goal
    return goalCount;
  } else {
    // do the actual calculation
    return Math.ceil((goalCount / totalDays) * daysAlong);
  }
};

const determinePositions = function(standingsRows: StandingsDataRow[], field: keyof StandingsDataRow) {
  const sorted = standingsRows.toSorted((a, b) => a[field] > b[field] ?
      -1 :
    a[field] < b[field] ?
      1 :
        (
          a.lastActivity < b.lastActivity ? -1 : a.lastActivity > b.lastActivity ? 1 : 0
        ));

  const positions: Record<string, number> = {};
  for(let i = 0; i < sorted.length; ++i) {
    const row = sorted[i];
    const previous = sorted.at(i - 1);

    if(i === 0) {
      positions[row.uuid] = i + 1;
    } else if(row[field] === previous[field] && row.lastActivity === previous.lastActivity) {
      positions[row.uuid] = positions[previous.uuid];
    } else {
      positions[row.uuid] = i + 1;
    }
  }

  return positions;
};

const hasGoal = computed(() => {
  return (props.measure === 'percent') || props.measure in props.leaderboard.goal;
});

const hasPar = computed(() => {
  return (props.measure === 'percent') || (props.measure in props.leaderboard.goal && !props.leaderboard.fundraiserMode);
});

type StandingsDataRow = {
  uuid: string;
  displayName: string;
  avatar: string;

  measure: TallyMeasure;
  goal: number;
  lastActivity: string;

  position: number;
  yesterdayPosition: number;

  progress: number;
  yesterdayProgress: number;

  versusPar: number | null;
  percent: string;
  percentRaw: number;
  yesterdayPercentRaw: number;
};

const standingsRows = computed<StandingsDataRow[]>(() => {
  const { daysAlong, totalDays } = determineStartAndEndDates(props.leaderboard, props.participants);
  const today = formatDate(new Date());
  const yesterday = formatDate(addDays(new Date(), -1));

  const rows = [];
  for(const participant of props.participants) {
    const measure = getMeasure(participant);
    const normalizedTallies = normalizeTallies(participant.tallies.filter(tally => tally.measure === measure));
    const accumulatedTallies = accumulateTallies(normalizedTallies);

    const todayTally = accumulatedTallies.findLast(tally => tally.date <= today) ?? { date: 'Never', value: 0, count: 0, accumulated: 0 };
    const yesterdayTally = accumulatedTallies.findLast(tally => tally.date <= yesterday) ?? { date: 'Never', value: 0, count: 0, accumulated: 0 };

    const row: StandingsDataRow = {
      uuid: participant.uuid,
      displayName: participant.displayName,
      avatar: participant.avatar,

      measure: getMeasure(participant),
      goal: getGoalCount(participant),
      lastActivity: todayTally.date,

      position: 0,
      yesterdayPosition: 0,

      progress: todayTally.accumulated,
      yesterdayProgress: yesterdayTally.accumulated,

      versusPar: hasPar.value ? todayTally.accumulated - getParForToday(participant, daysAlong, totalDays) : null,
      percent: formatPercent(todayTally.accumulated, getGoalCount(participant)) + '%',
      percentRaw: todayTally.accumulated / getGoalCount(participant),
      yesterdayPercentRaw: yesterdayTally.accumulated / getGoalCount(participant),
    };
    rows.push(row);
  }

  const currentPositions = determinePositions(rows, props.measure === 'percent' ? 'percentRaw' : 'progress');
  const yesterdayPositions = determinePositions(rows, props.measure === 'percent' ? 'yesterdayPercentRaw' : 'yesterdayProgress');
  for(const row of rows) {
    row.position = currentPositions[row.uuid];
    row.yesterdayPosition = yesterdayPositions[row.uuid];
  }

  const sortedRows = rows.sort(cmpByPosition);
  return sortedRows;
});

const cmpByPosition = function(a: StandingsDataRow, b: StandingsDataRow) {
  return a.position === b.position ?
      (a.displayName < b.displayName ? -1 : a.displayName > b.displayName ? 1 : 0) :
      (a.position - b.position);
};

const formatPositionChange = function(today: number, yesterday: number) {
  const change = yesterday - today;

  if(change > 0) {
    return '↑' + Math.abs(change);
  } else if(change < 0) {
    return '↓' + Math.abs(change);
  } else {
    return '—'; // em-dash
  }
};

</script>

<template>
  <DataTable :value="standingsRows">
    <Column
      header="#"
      field="position"
      sortable
      class="whitespace-nowrap text-right"
    />
    <Column
      class="whitespace-nowrap"
    >
      <template #body="slotProps">
        {{ formatPositionChange(slotProps.data.position, slotProps.data.yesterdayPosition) }}
      </template>
    </Column>
    <Column
      header="Participant"
      field="displayName"
      sortable
      class="whitespace-nowrap"
    >
      <template #body="slotProps">
        <div class="flex items-center gap-2">
          <UserAvatar
            :user="{ displayName: slotProps.data.displayName, avatar: slotProps.data.avatar }"
          />
          <div>
            {{ slotProps.data.displayName }}
          </div>
        </div>
      </template>
    </Column>
    <Column
      v-if="hasGoal"
      header="Percent"
      field="percent"
      sortable
      class="whitespace-nowrap text-right"
    >
      <template #body="slotProps">
        {{ slotProps.data.percent }}
      </template>
    </Column>
    <Column
      header="Total"
      field="progress"
      sortable
      class="whitespace-nowrap text-right"
    >
      <template #body="slotProps">
        {{ formatCount(slotProps.data.progress, slotProps.data.measure) }}
      </template>
    </Column>
    <Column
      v-if="props.measure === 'percent'"
      header="Goal"
      field="goal"
      sortable
      class="whitespace-nowrap text-right"
    >
      <template #body="slotProps">
        {{ formatCount(slotProps.data.goal, slotProps.data.measure) }}
      </template>
    </Column>
    <Column
      v-if="hasPar"
      header="Versus Par"
      field="versusPar"
      sortable
      class="whitespace-nowrap text-right"
    >
      <template #body="slotProps">
        {{ (slotProps.data.versusPar > 0 ? '+' : '') + formatCount(slotProps.data.versusPar, slotProps.data.measure) }}
      </template>
    </Column>
    <Column
      header="Last Update"
      field="lastActivity"
      sortable
      class="whitespace-nowrap text-right"
    />
  </DataTable>
</template>
