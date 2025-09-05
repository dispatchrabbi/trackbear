<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useProjectStore } from 'src/stores/project';
const projectStore = useProjectStore();

import { TALLY_MEASURE_INFO, formatCountValue, formatCountCounter } from 'src/lib/tally.ts';

import { getDayCounts, type DayCount } from 'src/lib/api/stats.ts';
import { calculateDailyStats, type DailyStats } from 'src/lib/stats.ts';

const dayCounts = ref<DayCount[]>([]);
async function loadDayCounts() {
  dayCounts.value = await getDayCounts();
}

const dailyStats = computed<DailyStats>(() => {
  return calculateDailyStats(dayCounts.value);
});

const projectStartingBalances = computed(() => {
  if(projectStore.projects === null) { return {}; }

  const startingBalances: MeasureCounts = projectStore.projects.reduce((balances, project) => {
    for(const measure of Object.keys(project.startingBalance)) {
      if(!(measure in balances)) {
        balances[measure] = 0;
      }

      balances[measure] += project.startingBalance[measure];
    }

    return balances;
  }, {});

  return startingBalances;
});

const measures = computed<TallyMeasure[]>(() => {
  const measuresAvailable = Object.keys(dailyStats.value.days);
  const lifetimeStartingBalanceMeasures = Object.keys(userStore.user.userSettings.lifetimeStartingBalance);
  const projectStartingBalanceMeasures = Object.keys(projectStartingBalances.value);
  // this makes sure they're in a consistent order
  return Object.keys(TALLY_MEASURE_INFO).filter(measure => measuresAvailable.includes(measure) || lifetimeStartingBalanceMeasures.includes(measure) || projectStartingBalanceMeasures.includes(measure));
});

const totals = computed<MeasureCounts>(() => {
  return measures.value.reduce((obj, measure) => {
    obj[measure] = (dailyStats.value.totals[measure] || 0) + (userStore.user.userSettings.lifetimeStartingBalance[measure] || 0) + (projectStartingBalances.value[measure] || 0);
    return obj;
  }, {});
});

const dayCountsByYear = computed<Record<string, DayCount[]>>(() => {
  const countsByYear = dayCounts.value.reduce((years, dayCount) => {
    const year = dayCount.date.substring(0, 4);

    if(!(year in years)) {
      years[year] = [];
    }

    years[year].push(dayCount);

    return years;
  }, {});

  return countsByYear;
});

const totalsByYear = computed<Record<string, MeasureCounts>>(() => {
  const byYear: Record<string, MeasureCounts> = {};

  for(const year of Object.keys(dayCountsByYear.value)) {
    const counts = dayCountsByYear.value[year];

    const totals: MeasureCounts = counts.reduce((obj, count) => {
      for(const measure of Object.keys(count.counts)) {
        obj[measure] = (obj[measure] ?? 0) + count.counts[measure];
      }

      return obj;
    }, {});

    byYear[year] = totals;
  }

  return byYear;
});

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import StatTile from 'src/components/goal/StatTile.vue';
import DayCountHeatmap from 'src/components/stats/DayCountHeatmap.vue';
import { MeasureCounts } from 'server/lib/models/tally/types';
import { TallyMeasure } from 'server/lib/models/tally/consts';
// import StreakCounter from 'src/components/dashboard/StreakCounter.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Stats' },
  { label: 'Lifetime', url: '/stats/lifetime' },
];

onMounted(() => {
  projectStore.populate();
  loadDayCounts();
});
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="max-w-screen-lg">
      <SectionTitle
        title="Grand Totals"
        subtitle="All your progress in TrackBear, plus project starting balances and your lifetime starting balance"
      />
      <div class="total-counts flex flex-wrap justify-evenly gap-2 mb-4">
        <StatTile
          v-for="measure in measures"
          :key="measure"
          :highlight="formatCountValue(totals[measure], measure)"
          :suffix="formatCountCounter(totals[measure], measure)"
        />
      </div>
      <div class="flex flex-col gap-4">
        <div
          v-for="year in Object.keys(dayCountsByYear).sort().reverse()"
          :key="year"
        >
          <SectionTitle :title="`${year} Activity`" />
          <div class="total-counts flex flex-wrap justify-evenly gap-2 mb-4">
            <StatTile
              v-for="measure of Object.keys(totalsByYear[year])"
              :key="measure"
              :highlight="formatCountValue(totalsByYear[year][measure], measure)"
              :suffix="formatCountCounter(totalsByYear[year][measure], measure)"
            />
          </div>
          <DayCountHeatmap
            :day-counts="dayCountsByYear[year]"
            :week-starts-on="userStore.user.userSettings.weekStartDay"
          />
        </div>
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
