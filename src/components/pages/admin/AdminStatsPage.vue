<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { getWeeklyActiveUsers, WeeklyStat } from 'src/lib/api/admin/stats.ts'

import AdminLayout from 'src/layouts/AdminLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import PlotWavyLineChart from 'src/components/chart/PlotWavyLineChart.vue';

import type { MenuItem } from 'primevue/menuitem';

const breadcrumbs: MenuItem[] = [
  { label: 'Admin', url: '/admin' },
  { label: 'Users', url: '/admin/users' },
];

const weeklyActiveUsers = ref<WeeklyStat[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadWeeklyActiveUsers = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    weeklyActiveUsers.value = await getWeeklyActiveUsers();
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

const data = computed(() => {
  return weeklyActiveUsers.value.map(({ weekStart, count }) => ({
    series: 'Weekly Active Users',
    date: weekStart,
    value: count,
  }));
});

onMounted(() => loadWeeklyActiveUsers());

</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <SectionTitle title="Weekly Active Users" />
    <div class="w-full">
      <PlotWavyLineChart
        :data="data"
      />
    </div>
    <div v-if="data.length === 0">
      No stats found. Are you sure this thing is on?
    </div>
  </AdminLayout>
</template>

<style scoped>
</style>
