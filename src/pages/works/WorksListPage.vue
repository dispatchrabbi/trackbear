<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();

import { getWorks, WorkWithTotals } from 'src/lib/api/work.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import WorkTile from 'src/components/work/WorkTile.vue';
import CreateWorkForm from 'src/components/work/CreateWorkForm.vue';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Works', url: '/works' },
];

const isCreateFormVisible = ref<boolean>(false);

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

const reloadWorks = async function() {
  workStore.populateWorks(true);
  loadWorks();
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
        @click="isCreateFormVisible = true"
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
    <div v-if="works.length === 0">
      You haven't made any projects yet. Click the <span class="font-bold">New Work</span> button to get started!
    </div>
    <Dialog
      v-model:visible="isCreateFormVisible"
      modal
    >
      <template #header>
        <h2 class="font-heading font-semibold uppercase">
          <span :class="PrimeIcons.PLUS" />
          Create Work
        </h2>
      </template>
      <CreateWorkForm
        @work:create="reloadWorks()"
        @request-close="isCreateFormVisible = false"
      />
    </Dialog>
  </ApplicationLayout>
</template>

<style scoped>
#add-progress-panel {
  max-width: 33%;
}
</style>
