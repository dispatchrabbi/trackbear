<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useWorkStore } from 'src/stores/work';
const workStore = useWorkStore();

import { getWork, WorkWithTallies } from 'src/lib/api/work.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import EditWorkForm from 'src/components/work/EditWorkForm.vue';
import DeleteWorkForm from 'src/components/work/DeleteWorkForm.vue';
import WorkTallyStreakChart from 'src/components/work/WorkTallyStreakChart.vue';
import WorkTallyLineChart from 'src/components/work/WorkTallyLineChart.vue';
import WorkTallyDataTable from 'src/components/work/WorkTallyDataTable.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

const workId = ref<number>(+route.params.id);
watch(
  () => route.params.id,
  newId => {
    workId.value = +newId;
    reloadWorks(); // this isn't a great pattern - it should get changed
  }
);

const work = ref<WorkWithTallies | null>(null);

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Works', url: '/works' },
    { label: work.value === null ? 'Loading...' : work.value.title, url: `/works/${workId.value}` },
  ];
  return crumbs;
});

const isEditFormVisible = ref<boolean>(false);
const isDeleteFormVisible = ref<boolean>(false);

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const loadWork = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    work.value = await getWork(+workId.value);
  } catch(err) {
    errorMessage.value = err.message;
    router.push('/works');
  } finally {
    isLoading.value = false;
  }
}

const reloadWorks = async function() {
  workStore.populateWorks(true);
  loadWork();
}

import { useEventBus } from 'src/lib/use-event-bus';
const eventBus = useEventBus();
eventBus.on('tally:create', reloadWorks);

loadWork();

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div v-if="work">
      <header class="mb-4">
        <div class="actions flex gap-2">
          <SectionTitle
            :title="work.title"
          />
          <div class="spacer grow" />
          <Button
            label="Edit"
            :icon="PrimeIcons.PENCIL"
            @click="isEditFormVisible = true"
          />
          <Button
            severity="danger"
            label="Delete"
            :icon="PrimeIcons.TRASH"
            @click="isDeleteFormVisible = true"
          />
        </div>
        <h2 class="description font-heading italic font-light">
          {{ work.description }}
        </h2>
      </header>
      <div
        v-if="work.tallies.length > 0"
        class="flex flex-wrap gap-2"
      >
        <div class="w-full max-w-screen-md">
          <WorkTallyStreakChart
            :work="work"
            :tallies="work.tallies"
          />
        </div>
        <div class="w-full max-w-screen-md">
          <WorkTallyLineChart
            :work="work"
            :tallies="work.tallies"
          />
        </div>
        <div class="w-full max-w-screen-md">
          <WorkTallyDataTable
            :tallies="work.tallies"
          />
        </div>
      </div>
      <div v-else>
        You haven't logged any progress on this project. You want the cool graphs? Get writing!
      </div>
      <Dialog
        v-model:visible="isEditFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.PENCIL" />
            Edit Work
          </h2>
        </template>
        <EditWorkForm
          :work="work"
          @work:edit="reloadWorks()"
          @request-close="isEditFormVisible = false"
        />
      </Dialog>
      <Dialog
        v-model:visible="isDeleteFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.TRASH" />
            Delete Work
          </h2>
        </template>
        <DeleteWorkForm
          :work="work"
          @work:delete="workStore.populateWorks(true)"
          @request-close="router.push('/works')"
        />
      </Dialog>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
#add-progress-panel {
  max-width: 33%;
}
</style>
