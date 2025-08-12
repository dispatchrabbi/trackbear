<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import {
  getWeeklyActiveUsers, getWeeklySignups, WeeklyStat,
  getDailyActiveUsers, getDailySignups, DailyStat,
} from 'src/lib/api/admin/stats.ts';

import AdminLayout from 'src/layouts/AdminLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
// import PlotBarChart from 'src/components/chart/PlotBarChart.vue';
import ProgressChart from 'src/components/chart/ProgressChart.vue';

import type { MenuItem } from 'primevue/menuitem';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';

const breadcrumbs: MenuItem[] = [
  { label: 'Admin', url: '/admin' },
  { label: 'Users', url: '/admin/users' },
];

const weeklyActiveUsers = ref<WeeklyStat[]>([]);
const loadWeeklyActiveUsers = async function() {
  try {
    weeklyActiveUsers.value = await getWeeklyActiveUsers();
  } catch (err) { console.log(err); }
};

const weeklyActiveUsersData = computed(() => {
  return weeklyActiveUsers.value.map(({ weekStart, count }) => ({
    series: 'Weekly Active Users',
    date: weekStart,
    count,
  }));
});

const weeklySignups = ref<WeeklyStat[]>([]);
const loadWeeklySignups = async function() {
  try {
    weeklySignups.value = await getWeeklySignups();
  } catch (err) { console.log(err); }
};

const weeklySignupsData = computed(() => {
  return weeklySignups.value.map(({ weekStart, count }) => ({
    series: 'Weekly Signups',
    date: weekStart,
    count,
  }));
});

const dailyActiveUsers = ref<DailyStat[]>([]);
const loadDailyActiveUsers = async function() {
  try {
    dailyActiveUsers.value = await getDailyActiveUsers();
  } catch (err) { console.log(err); }
};

const dailyActiveUsersData = computed(() => {
  return dailyActiveUsers.value.map(({ date, count }) => ({
    series: 'Daily Active Users',
    date,
    count,
  }));
});

const dailySignups = ref<DailyStat[]>([]);
const loadDailySignups = async function() {
  try {
    dailySignups.value = await getDailySignups();
  } catch (err) { console.log(err); }
};

const dailySignupsData = computed(() => {
  return dailySignups.value.map(({ date, count }) => ({
    series: 'Daily Signups',
    date,
    count,
  }));
});

onMounted(() => {
  loadWeeklyActiveUsers();
  loadWeeklySignups();

  loadDailyActiveUsers();
  loadDailySignups();
});

</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="flex flex-col gap-4">
      <div>
        <SectionTitle title="Weekly Active Users" />
        <div class="max-w-screen-lg">
          <ProgressChart
            :tallies="weeklyActiveUsersData"
            :measure-hint="TALLY_MEASURE.WORD"
            graph-title="Weekly Active Users"
          />
        </div>
      </div>
      <div>
        <SectionTitle title="Weekly Signups" />
        <div class="max-w-screen-lg">
          <ProgressChart
            :tallies="weeklySignupsData"
            :measure-hint="TALLY_MEASURE.WORD"
            graph-title="Weekly Signups"
          />
        </div>
      </div>
      <div>
        <SectionTitle title="Daily Active Users" />
        <div class="max-w-screen-lg">
          <ProgressChart
            :tallies="dailyActiveUsersData"
            :measure-hint="TALLY_MEASURE.WORD"
            graph-title="Daily Active Users"
          />
        </div>
      </div>
      <div>
        <SectionTitle title="Daily Signups" />
        <div class="max-w-screen-lg">
          <ProgressChart
            :tallies="dailySignupsData"
            :measure-hint="TALLY_MEASURE.WORD"
            graph-title="Daily Signups"
          />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
</style>
