<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

import { getWorks, WorkWithTotals } from 'src/lib/api/work.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import WorkTile from 'src/components/works/WorkTile.vue';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Works', url: '/works' },
];

const works = ref<WorkWithTotals[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadWorks = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    works.value = await getWorks();
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

loadWorks();

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="actions flex justify-end mb-4">
      <Button
        label="New Work"
        :icon="PrimeIcons.PLUS"
      />
    </div>
    <div
      v-for="work in works"
      :key="work.id"
      class="mb-2"
    >
      <RouterLink :to="`/works/${work.id}`">
        <WorkTile :work="work" />
      </RouterLink>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
#add-progress-panel {
  max-width: 33%;
}
</style>
