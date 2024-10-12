<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { getWeeklyActiveUsers, getWeeklySignups, WeeklyStat } from 'src/lib/api/admin/stats.ts'

import AdminLayout from 'src/layouts/AdminLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import PlotWavyLineChart from 'src/components/chart/PlotWavyLineChart.vue';

import type { MenuItem } from 'primevue/menuitem';

const breadcrumbs: MenuItem[] = [
  { label: 'Admin', url: '/admin' },
  { label: 'Users', url: '/admin/users' },
];

const weeklyActiveUsers = ref<WeeklyStat[]>([]);
const loadWeeklyActiveUsers = async function() {
  try {
    weeklyActiveUsers.value = await getWeeklyActiveUsers();
  } catch(err) { }
}

const weeklySignups = ref<WeeklyStat[]>([]);
const loadWeeklySignups = async function() {
  try {
    weeklySignups.value = await getWeeklySignups();
  } catch(err) { }
}

const activeUsersData = computed(() => {
  return weeklyActiveUsers.value.map(({ weekStart, count }) => ({
    series: 'Weekly Active Users',
    date: weekStart,
    value: count,
  }));
});

const signupsData = computed(() => {
  return weeklySignups.value.map(({ weekStart, count }) => ({
    series: 'Weekly Signups',
    date: weekStart,
    value: count,
  }));
});

onMounted(() => {
  loadWeeklyActiveUsers();
  loadWeeklySignups();
});

</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <SectionTitle title="Weekly Active Users" />
    <div class="max-w-screen-lg">
      <PlotWavyLineChart
        :data="activeUsersData"
      />
    </div>
    <div class="max-w-screen-lg">
      <PlotWavyLineChart
        :data="signupsData"
      />
    </div>
  </AdminLayout>
</template>

<style scoped>
</style>
