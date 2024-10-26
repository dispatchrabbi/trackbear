<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();

import { getWork, type WorkWithTallies } from 'src/lib/api/work.ts';
import type { Tally } from 'src/lib/api/tally.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DeleteWorkForm from 'src/components/work/DeleteWorkForm.vue';
import UploadCoverForm from 'src/components/work/UploadCoverForm.vue';
import ActivityHeatmap from 'src/components/dashboard/ActivityHeatmap.vue';
import WorkTallyLineChart from 'src/components/work/WorkTallyLineChart.vue';
import WorkTallyDataTable from 'src/components/work/WorkTallyDataTable.vue';
import DetailPageHeader from 'src/components/layout/DetailPageHeader.vue';
import WorkCover from 'src/components/work/WorkCover.vue';

const workId = ref<number>(+route.params.workId);
watch(
  () => route.params.workId,
  newId => {
    if(newId !== undefined) {
      workId.value = +newId;
      reloadWorks(); // this isn't a great pattern - it should get changed
    }
  }
);

const work = ref<WorkWithTallies | null>(null);

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Projects', url: '/works' },
    { label: work.value === null ? 'Loading...' : work.value.title, url: `/works/${workId.value}` },
  ];
  return crumbs;
});

const isDeleteFormVisible = ref<boolean>(false);
const isCoverFormVisible = ref<boolean>(false);

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const loadWork = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    work.value = await getWork(+workId.value);
  } catch(err) {
    errorMessage.value = err.message;
    // the ApplicationLayout takes care of this. Otherwise, this will redirect to /works before ApplicationLayout
    // can redirect to /login.
    // TODO: figure out a better way to ensure that there's no race condition here
    if(err.code !== 'NOT_LOGGED_IN') {
      router.push({ name: 'works' });
    }
  } finally {
    isLoading.value = false;
  }
}

const reloadWorks = async function() {
  workStore.populate(true);
  loadWork();
}

onMounted(() => {
  useEventBus<{ tally: Tally }>('tally:create').on(reloadWorks);
  useEventBus<{ tally: Tally }>('tally:edit').on(reloadWorks);
  useEventBus<{ tally: Tally }>('tally:delete').on(reloadWorks);

  loadWork();
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="work"
      class="max-w-screen-md"
    >
      <DetailPageHeader
        :title="work.title"
        :subtitle="work.description"
      >
        <template #image>
          <WorkCover :work="work" />
        </template>
        <template #actions>
          <Button
            label="Configure Project"
            severity="info"
            :icon="PrimeIcons.COG"
            @click="router.push({ name: 'edit-work', params: { workId: work.id } })"
          />
          <Button
            severity="danger"
            label="Delete Project"
            :icon="PrimeIcons.TRASH"
            @click="isDeleteFormVisible = true"
          />
        </template>
      </DetailPageHeader>
      <div
        v-if="work.tallies.length > 0"
        class="flex flex-col gap-2 max-w-screen-md"
      >
        <div class="w-full">
          <ActivityHeatmap
            :tallies="work.tallies"
          />
        </div>
        <div class="w-full">
          <WorkTallyLineChart
            :work="work"
            :tallies="work.tallies"
          />
        </div>
        <div class="w-full">
          <WorkTallyDataTable
            :work="work"
            :tallies="work.tallies"
          />
        </div>
      </div>
      <div v-else>
        You haven't logged any progress on this project. You want the cool graphs? Get writing!
      </div>
      <Dialog
        v-model:visible="isDeleteFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.TRASH" />
            Delete Project
          </h2>
        </template>
        <DeleteWorkForm
          :work="work"
          @work:delete="workStore.populate(true)"
          @form-success="router.push('/works')"
        />
      </Dialog>
      <Dialog
        v-model:visible="isCoverFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.BOOK" />
            Upload Cover
          </h2>
        </template>
        <UploadCoverForm :work="work" />
      </Dialog>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
