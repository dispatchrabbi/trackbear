<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Board, FullParticipant } from 'src/lib/api/board.ts';

import { differenceInCalendarDays } from 'date-fns';

import { formatDate, parseDateString } from "src/lib/date.ts";
import { formatCount } from 'src/lib/tally.ts';
import { formatPercent } from 'src/lib/number.ts';

import { normalizeTallies, accumulateTallies, determineChartStartDate, determineChartEndDate } from '../chart/chart-functions.ts';
import UserAvatar from 'src/components/UserAvatar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { TallyMeasure } from 'server/lib/models/tally/consts.ts';

const props = defineProps<{
  board: Board;
  participants: FullParticipant[];
  measure: TallyMeasure | 'percent';
}>();

const getMeasure = function(participant: FullParticipant): TallyMeasure {
  return props.measure === 'percent' ? participant.goal.measure : props.measure;
};

const getGoalCount = function(participant) {
  return props.measure === 'percent' ? participant.goal.count : props.board.goal[props.measure];
};

const hasGoal = computed(() => {
  return (props.measure === 'percent') || props.measure in props.board.goal;
});

const hasPar = computed(() => {
  return (props.measure === 'percent') || (props.measure in props.board.goal && !props.board.fundraiserMode);
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

const tableData = computed(() => {
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

  const startDate = determineChartStartDate(earliestDate, props.board.startDate);
  const endDate = determineChartEndDate(latestDate, props.board.endDate);
  const daysBetween = differenceInCalendarDays(parseDateString(endDate), parseDateString(startDate)) + 1; // +1 because it's inclusive
  const daysAlong = differenceInCalendarDays(new Date(), parseDateString(startDate)) + 1; // +1 so that it counts today

  type StandingsDataRow = {
    uuid: string;
    position: number;
    displayName: string;
    avatar: string;
    progress: number;
    measure: TallyMeasure;
    versusPar: number | null;
    goal: number;
    percentRaw: number;
    percent: string;
    lastActivity: string;
  };
  const data: StandingsDataRow[] = [];

  const getPar = function(participant) {
    if(!hasPar.value) { return null; }

    const goalCount = getGoalCount(participant);
    if(props.board.endDate === null) {
      return goalCount;
    } else {
      // if we're past the end, par is just the goal; otherwise, do the intermediate calculation
      return daysAlong >= daysBetween ? goalCount : Math.ceil((goalCount / daysBetween) * daysAlong);
    }
  };

  const today = formatDate(new Date());
  const sortedParticipants = props.participants.toSorted((a, b) => {
    const aDisplayName = a.displayName.toLowerCase();
    const bDisplayName = b.displayName.toLowerCase();
    return aDisplayName < bDisplayName ? -1 : aDisplayName > bDisplayName ? 1 : 0;
  })
  for(const participant of sortedParticipants) {
    const normalizedTallies = normalizeTallies(participant.tallies.filter(tally => tally.measure === getMeasure(participant)));
    const accumulatedTallies = accumulateTallies(normalizedTallies);

    const lastRelevantTally = accumulatedTallies.findLast(tally => tally.date <= today);
    if(lastRelevantTally) {
      data.push({
        uuid: participant.uuid,
        position: 0,
        displayName: participant.displayName,
        avatar: participant.avatar,
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
  // forEach, not map, because I need access to the modified previous elements
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
  <DataTable :value="tableData">
    <Column
      header="#"
      field="position"
      sortable
      class="whitespace-nowrap text-right"
    />
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

<style scoped>
</style>
