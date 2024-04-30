<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();

import { getWork, WorkWithTallies } from 'src/lib/api/work.ts';
import { Tally } from 'src/lib/api/tally.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import EditWorkForm from 'src/components/work/EditWorkForm.vue';
import DeleteWorkForm from 'src/components/work/DeleteWorkForm.vue';
import WorkActivityHeatmap from 'src/components/work/WorkActivityHeatmap.vue';
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
    { label: 'Projects', url: '/works' },
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
    <div v-if="work">
      <header class="mb-4">
        <div class="actions flex gap-2 items-start">
          <SectionTitle
            :title="work.title"
            :subtitle="work.description"
          />
          <div class="spacer grow" />
          <div class="flex flex-col md:flex-row gap-2">
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
        </div>
      </header>
      <div
        v-if="work.tallies.length > 0"
        class="flex flex-col gap-2 max-w-screen-md"
      >
        <div class="w-full">
          <WorkActivityHeatmap
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
        v-model:visible="isEditFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.PENCIL" />
            Edit Project
          </h2>
        </template>
        <EditWorkForm
          :work="work"
          @work:edit="reloadWorks()"
          @form-success="isEditFormVisible = false"
        />
      </Dialog>
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
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
