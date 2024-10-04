<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useWorkStore } from 'src/stores/work';
const workStore = useWorkStore();

import { TALLY_MEASURE_INFO, formatCountValue, formatCountCounter } from 'src/lib/tally.ts';

import { getDayCounts, DayCount } from 'src/lib/api/stats.ts';
const dayCounts = ref<DayCount[]>([]);
async function loadDayCounts() {
  dayCounts.value = await getDayCounts();
}

import { calculateDailyStats } from 'src/lib/stats.ts';
const dailyStats = computed(() => {
  return calculateDailyStats(dayCounts.value);
});

const workStartingBalances = computed(() => {
  if(workStore.works === null) { return {}; }

  const startingBalances = workStore.works.reduce((balances, work) => {
    for(const measure of Object.keys(work.startingBalance)) {
      if(!(measure in balances)) { balances[measure] = 0; }
      balances[measure] += work.startingBalance[measure];
    }

    return balances;
  }, {});

  return startingBalances;
});

const measures = computed(() => {
  const measuresAvailable = Object.keys(dailyStats.value.days);
  const lifetimeStartingBalanceMeasures = Object.keys(userStore.user.userSettings.lifetimeStartingBalance);
  const workStartingBalanceMeasures = Object.keys(workStartingBalances.value);
  // this makes sure they're in a consistent order
  return Object.keys(TALLY_MEASURE_INFO).filter(measure => measuresAvailable.includes(measure) || lifetimeStartingBalanceMeasures.includes(measure) || workStartingBalanceMeasures.includes(measure));
});

const totals = computed(() => {
  return measures.value.reduce((obj, measure) => {
    obj[measure] = (dailyStats.value.totals[measure] || 0) + (userStore.user.userSettings.lifetimeStartingBalance[measure] || 0) + (workStartingBalances.value[measure] || 0);
    return obj;
  }, {});
});

const dayCountsByYear = computed(() => {
  const countsByYear = dayCounts.value.reduce((years, dayCount) => {
    const year = dayCount.date.substring(0, 4);

    if(!(year in years)) { years[year] = []; }
    years[year].push(dayCount);

    return years;
  }, {});

  return countsByYear;
});

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import StatTile from 'src/components/goal/StatTile.vue';
import DayCountHeatmap from 'src/components/stats/DayCountHeatmap.vue';
// import StreakCounter from 'src/components/dashboard/StreakCounter.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Stats' },
  { label: 'Lifetime', url: '/stats/lifetime' },
];

onMounted(() => {
  workStore.populate();
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
          <DayCountHeatmap
            :day-counts="dayCountsByYear[year]"
          />
        </div>
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
