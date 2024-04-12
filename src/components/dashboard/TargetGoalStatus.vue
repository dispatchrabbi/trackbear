<script setup lang="ts">
import { computed, defineProps } from 'vue';
import themeColors from 'src/themes/primevue.ts';

import { usePreferredColorScheme } from '@vueuse/core';

import { Goal } from 'src/lib/api/goal.ts';
import { Tally } from 'src/lib/api/tally.ts';

import { compileTallies, formatCount } from 'src/lib/tally.ts';
import { formatDate } from 'src/lib/date.ts';

import Card from 'primevue/card';
import MeterGroup, { MeterItem } from 'primevue/metergroup';
import { GoalTargetParameters } from 'server/lib/models/goal.ts';
import { describeGoal } from 'src/lib/goal.ts';

const props = defineProps<{
  goal: Goal,
  tallies: Tally[],
}>();

const targetStats = computed(() => {
  const params = props.goal.parameters as GoalTargetParameters;
  const today = formatDate(new Date());

  const compiled = compileTallies(props.tallies);

  const lastTally = compiled[compiled.length - 1];
  const lastTallyIsToday = lastTally.date === today;

  const measure = params.threshold.measure;

  return {
    measure: measure,
    total: params.threshold.count,
    today: lastTallyIsToday ? lastTally.count[measure] : 0,
    beforeToday: lastTallyIsToday ? lastTally.total[measure] - lastTally.count[measure] : lastTally.total[measure],
  };
});

const meterStats = computed(() => {
  const preferredColorScheme = usePreferredColorScheme().value;

  const colors = {
    past: preferredColorScheme === 'dark' ? themeColors.surface[400] : themeColors.surface[500],
    today: preferredColorScheme === 'dark' ? themeColors.primary[400] : themeColors.primary[500],
  }

  return {
    values: [
      { label: 'Past Progress', color: colors.past, value: targetStats.value.beforeToday },
      { label: 'Today', color: colors.today, value: targetStats.value.today },
    ] as MeterItem[],
  };
});
</script>

<template>
  <Card
    class="max-w-full"
  >
    <template #title>
      <div class="flex items-baseline gap-2 flex-wrap">
        <div>{{ props.goal.title }}</div>
        <div class="font-light italic text-sm">
          {{ describeGoal(props.goal) }}
        </div>
      </div>
    </template>
    <template #content>
      <MeterGroup
        :value="meterStats.values"
        :max="targetStats.total"
      >
        <template #label="{ value }">
          <ol
            class="flex flex-wrap gap-4 align-end m-0 p-0 list-none"
            data-pc-section="labellist"
          >
            <li
              v-for="val of value"
              :key="val.label"
              class="inline-flex items-center gap-2"
              data-pc-section="labellistitem"
            >
              <span
                class="inline-flex bg-primary-500 dark:bg-primary-400 w-2 h-2 rounded-full"
                :style="{ backgroundColor: val.color }"
                data-pc-section="labellisttype"
              />
              <span
                class=""
                data-pc-section="label"
              >
                {{ val.label }} ({{ formatCount(val.value, targetStats.measure) }})
              </span>
            </li>
          </ol>
        </template>
      </MeterGroup>
    </template>
  </Card>
</template>
