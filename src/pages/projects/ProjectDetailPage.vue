<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useProjectStore } from 'src/stores/project';
const projectStore = useProjectStore();

import { type Project } from 'src/lib/api/project';
import { type TallyWithWorkAndTags, type Tally, getTallies } from 'src/lib/api/tally.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DeleteProjectForm from 'src/components/project/DeleteProjectForm.vue';
import UploadCoverForm from 'src/components/project/UploadCoverForm.vue';
import ProjectActivityHeatmap from 'src/components/project/ProjectActivityHeatmap.vue';
import ProjectTallyLineChart from 'src/components/project/ProjectTallyLineChart.vue';
import ProjectTallyDataTable from 'src/components/project/ProjectTallyDataTable.vue';
import DetailPageHeader from 'src/components/layout/DetailPageHeader.vue';
import ProjectCover from 'src/components/project/ProjectCover.vue';

const projectId = ref<number>(+route.params.projectId);
watch(
  () => route.params.projectId,
  newId => {
    if(newId !== undefined) {
      projectId.value = +newId;
      reloadData(); // this isn't a great pattern - it should get changed
    }
  },
);

const isDeleteFormVisible = ref<boolean>(false);
const isCoverFormVisible = ref<boolean>(false);

const project = ref<Project | null>(null);
const isProjectLoading = ref<boolean>(false);
const projectErrorMessage = ref<string | null>(null);
const loadProject = async function() {
  isProjectLoading.value = true;
  projectErrorMessage.value = null;

  try {
    await projectStore.populate();
    project.value = projectStore.get(+projectId.value);
  } catch (err) {
    projectErrorMessage.value = err.message;
    // the ApplicationLayout takes care of this. Otherwise, this will redirect to /projects before ApplicationLayout
    // can redirect to /login.
    // TODO: figure out a better way to ensure that there's no race condition here
    if(err.code !== 'NOT_LOGGED_IN') {
      router.push({ name: 'projects' });
    }
  } finally {
    isProjectLoading.value = false;
  }
};

const tallies = ref<TallyWithWorkAndTags[]>([]);
const isTalliesLoading = ref<boolean>(false);
const talliesErrorMessage = ref<string | null>(null);
const loadTallies = async function() {
  if(project.value === null) {
    tallies.value = [];
    isTalliesLoading.value = false;
    talliesErrorMessage.value = null;
    return;
  }

  isTalliesLoading.value = true;
  talliesErrorMessage.value = null;

  try {
    const talliesForProject = await getTallies({
      works: [project.value.id],
    });

    tallies.value = talliesForProject;
  } catch (err) {
    talliesErrorMessage.value = err.message;
  } finally {
    isTalliesLoading.value = false;
  }
};

const reloadData = async function() {
  await loadProject();
  await loadTallies();
};

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Projects', url: '/projects' },
    { label: project.value === null ? 'Loading...' : project.value.title, url: `/projects/${projectId.value}` },
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
      v-if="project && !isTalliesLoading"
      class="max-w-screen-md"
    >
      <DetailPageHeader
        :title="project.title"
        :subtitle="project.description"
      >
        <template
          v-if="userStore.user!.userSettings.displayCovers"
          #image
        >
          <ProjectCover :project="project" />
        </template>
        <template #actions>
          <Button
            label="Configure Project"
            severity="info"
            :icon="PrimeIcons.COG"
            @click="router.push({ name: 'edit-project', params: { projectId: project.id } })"
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
          <ProjectActivityHeatmap
            :project="project"
            :tallies="tallies"
            :week-starts-on="userStore.user!.userSettings.weekStartDay"
          />
        </div>
        <div class="w-full">
          <ProjectTallyLineChart
            :peoject="project"
            :tallies="tallies"
          />
        </div>
        <div class="w-full">
          <ProjectTallyDataTable
            :project="project"
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
        <DeleteProjectForm
          :project="project"
          @form-success="router.push('/projects')"
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
        <UploadCoverForm :project="project" />
      </Dialog>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
