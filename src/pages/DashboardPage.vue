<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { getTallies, Tally } from 'src/lib/api/tally.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import StreakChart from 'src/components/dashboard/StreakChart.vue';
import StreakCounter from 'src/components/dashboard/StreakCounter.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Dashboard', url: '/dashboard' },
];

const tallies = ref<Tally[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadTallies = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    tallies.value = await getTallies();
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadTallies();
});
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="max-w-screen-lg">
      <div class="">
        <SectionTitle title="Activity" />
        <StreakChart
          :tallies="tallies"
        />
      </div>
      <div class="mt-4">
        <SectionTitle title="Streaks" />
        <StreakCounter
          :tallies="tallies"
        />
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
#add-progress-panel {
  max-width: 33%;
}
</style>
