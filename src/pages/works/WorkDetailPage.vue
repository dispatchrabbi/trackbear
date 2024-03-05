<script setup lang="ts">
import { ref, computed } from 'vue';

import { useRoute, useRouter, RouterLink } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { getWork, WorkWithTallies } from 'src/lib/api/work.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import WorkTallyLineChart from 'src/components/works/WorkTallyLineChart.vue';
import WorkTallyDataTable from 'src/components/works/WorkTallyDataTable.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

const work = ref<WorkWithTallies | null>(null);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadWork = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const workId = +route.params.id;
    work.value = await getWork(workId);
  } catch(err) {
    errorMessage.value = err.message;
    router.push('/works');
  } finally {
    isLoading.value = false;
  }
}

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Works', url: '/works' },
    { label: work.value === null ? 'Loading...' : work.value.title, url: `/works/${route.params.id}` },
  ];
  return crumbs;
});

loadWork();

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div v-if="work">
      <div class="actions flex justify-between mb-4">
        <SectionTitle
          :title="work.title"
        />
        <Button
          label="Edit"
          :icon="PrimeIcons.PENCIL"
        />
      </div>
      <WorkTallyLineChart
        :work="work"
        :tallies="work.tallies"
      />
      <WorkTallyDataTable
        :tallies="work.tallies"
      />
    </div>
  </ApplicationLayout>
</template>

<style scoped>
#add-progress-panel {
  max-width: 33%;
}
</style>
