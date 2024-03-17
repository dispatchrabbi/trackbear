<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';

import { Tally } from 'src/lib/api/tally.ts';
import { Goal } from 'src/lib/api/goal.ts';
import { analyzeHabitTallies } from 'src/lib/goal.ts';
import { formatCount } from 'src/lib/tally.ts';

import Card from 'primevue/card';
import InputSwitch from 'primevue/inputswitch';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { PrimeIcons } from 'primevue/api';
import { GoalHabitParameters } from 'server/lib/models/goal.ts';

const props = defineProps<{
  tallies: Tally[];
  goal: Goal;
}>();

const habitStats = computed(() => {
  return analyzeHabitTallies(props.tallies, props.goal);
});

const onlyShowHits = ref<boolean>(false);
const filteredRanges = computed(() => {
  return onlyShowHits.value ? habitStats.value.ranges.filter(range => range.isSuccess) : habitStats.value.ranges;
});

function formatTallyDateCount(tallies: Tally[]) {
  const dateSet = new Set(tallies.map(tally => tally.date));

  return `${dateSet.size} ${dateSet.size === 1 ? 'day' : 'days'}`;
}

function formatTallySum(tallies: Tally[]) {
  const sum = tallies.reduce((total, tally) => total + tally.count, 0);

  return formatCount(sum, (props.goal.parameters as GoalHabitParameters).threshold.measure);
}

</script>

<template>
  <div class="flex gap-2">
    <Card>
      <template #title>
        <span :class="PrimeIcons.FORWARD" /> Current Streak
      </template>
      <template #content>
        <p class="text-2xl">
          {{ habitStats.streaks.current }}
        </p>
      </template>
    </Card>
    <Card>
      <template #title>
        <span :class="PrimeIcons.FLAG_FILL" /> Longest Streak
      </template>
      <template #content>
        <p class="text-2xl">
          {{ habitStats.streaks.longest }}
        </p>
      </template>
    </Card>
  </div>
  <div>
    <div class="flex gap-2 justify-end items-center">
      <InputSwitch v-model="onlyShowHits" />
      <div>Show only ⭐️</div>
    </div>
    <DataTable
      :value="filteredRanges"
    >
      <Column header="⭐️">
        <template #body="slotProps">
          <span :class="slotProps.data.isSuccess ? PrimeIcons.STAR_FILL : PrimeIcons.STAR" />
        </template>
      </Column>
      <Column header="Dates">
        <template #body="slotProps">
          <span v-if="slotProps.data.startDate === slotProps.data.endDate">{{ slotProps.data.startDate }}</span>
          <span v-else>{{ slotProps.data.startDate }} – {{ slotProps.data.endDate }}</span>
        </template>
      </Column>
      <Column header="Progress">
        <template #body="slotProps">
          <span v-if="(goal.parameters as GoalHabitParameters).threshold === null">{{ formatTallyDateCount(slotProps.data.tallies) }}</span>
          <span v-else>{{ formatTallySum(slotProps.data.tallies) }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
