<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();

import { type Work } from 'src/lib/api/work.ts';
import { type TallyWithWorkAndTags, type Tally, getTallies } from 'src/lib/api/tally.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DeleteWorkForm from 'src/components/work/DeleteWorkForm.vue';
import UploadCoverForm from 'src/components/work/UploadCoverForm.vue';
import WorkActivityHeatmap from 'src/components/work/WorkActivityHeatmap.vue';
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
      reloadData(); // this isn't a great pattern - it should get changed
    }
  },
);

const isDeleteFormVisible = ref<boolean>(false);
const isCoverFormVisible = ref<boolean>(false);

const work = ref<Work | null>(null);
const isWorkLoading = ref<boolean>(false);
const workErrorMessage = ref<string | null>(null);
const loadWork = async function() {
  isWorkLoading.value = true;
  workErrorMessage.value = null;

  try {
    await workStore.populate();
    work.value = workStore.get(+workId.value);
  } catch (err) {
    workErrorMessage.value = err.message;
    // the ApplicationLayout takes care of this. Otherwise, this will redirect to /works before ApplicationLayout
    // can redirect to /login.
    // TODO: figure out a better way to ensure that there's no race condition here
    if(err.code !== 'NOT_LOGGED_IN') {
      router.push({ name: 'works' });
    }
  } finally {
    isWorkLoading.value = false;
  }
};

const tallies = ref<TallyWithWorkAndTags[]>([]);
const isTalliesLoading = ref<boolean>(false);
const talliesErrorMessage = ref<string | null>(null);
const loadTallies = async function() {
  isTalliesLoading.value = true;
  talliesErrorMessage.value = null;

  try {
    const talliesForWork = await getTallies({
      works: [work.value.id],
    });

    tallies.value = talliesForWork;
  } catch (err) {
    talliesErrorMessage.value = err.message;
  } finally {
    isTalliesLoading.value = false;
  }
};

const reloadData = async function() {
  await loadWork();
  await loadTallies();
};

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Projects', url: '/works' },
    { label: work.value === null ? 'Loading...' : work.value.title, url: `/works/${workId.value}` },
  ];
  return crumbs;
});

onMounted(async () => {
  useEventBus<{ tally: Tally }>('tally:create').on(loadTallies);
  useEventBus<{ tally: Tally }>('tally:edit').on(loadTallies);
  useEventBus<{ tally: Tally }>('tally:delete').on(loadTallies);

  await userStore.populate();
  await reloadData();
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="work && !isTalliesLoading"
      class="max-w-screen-md"
    >
      <DetailPageHeader
        :title="work.title"
        :subtitle="work.description"
      >
        <template
          v-if="userStore.user.userSettings.displayCovers"
          #image
        >
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
        v-if="tallies.length > 0"
        class="flex flex-col gap-2 max-w-screen-md"
      >
        <div class="w-full">
          <WorkActivityHeatmap
            :work="work"
            :tallies="tallies"
            :week-starts-on="userStore.user.userSettings.weekStartDay"
          />
        </div>
        <div class="w-full">
          <WorkTallyLineChart
            :work="work"
            :tallies="tallies"
          />
        </div>
        <div class="w-full">
          <WorkTallyDataTable
            :work="work"
            :tallies="tallies"
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
