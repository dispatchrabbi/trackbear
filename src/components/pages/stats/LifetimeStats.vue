<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import { User } from '@prisma/client';
import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { getDayCounts, DayCount } from 'src/lib/api/stats.ts';
const dayCounts = ref<DayCount[]>([]);
async function loadDayCounts() {
  dayCounts.value = await getDayCounts();
}

import { calculateDailyStats } from 'src/lib/stats.ts';
const dailyStats = computed(() => {
  return calculateDailyStats(dayCounts.value);
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
import YearlyHeatmap from 'src/components/stats/YearlyHeatmap.vue';
import StreakCounter from 'src/components/dashboard/StreakCounter.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Stats' },
  { label: 'Lifetime', url: '/stats/lifetime' },
];

onMounted(() => {
  loadDayCounts();
});
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="max-w-screen-lg">
      <SectionTitle title="Lifetime Stats" />
      <p>Many stat! Much wow.</p>
      <!-- <p><pre>{{ JSON.stringify(userStore.user.userSettings) }}</pre></p>
      <p><pre>{{ JSON.stringify(dailyStats) }}</pre></p> -->
      <div class="flex flex-col gap-4">
        <div
          v-for="year in Object.keys(dayCountsByYear).sort().reverse()"
          :key="year"
        >
          <SectionTitle :title="`${year} Activity`" />
          <YearlyHeatmap
            :day-counts="dayCountsByYear[year]"
          />
        </div>
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
