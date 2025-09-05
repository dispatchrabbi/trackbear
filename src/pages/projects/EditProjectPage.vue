<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useProjectStore } from 'src/stores/project';
const projectStore = useProjectStore();

import { deleteCover, type Project } from 'src/lib/api/project';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import EditProjectForm from 'src/components/project/EditProjectForm.vue';
import UploadCoverForm from 'src/components/project/UploadCoverForm.vue';
import ProjectCover from 'src/components/project/ProjectCover.vue';
import type { MenuItem } from 'primevue/menuitem';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { PrimeIcons } from 'primevue/api';

import { useConfirm } from 'primevue/useconfirm';
const confirm = useConfirm();

const projectId = ref<number>(+route.params.projectId);
watch(() => route.params.projectId, newId => {
  if(newId !== undefined) {
    projectId.value = +newId;
    loadProject();
  }
});

const project = ref<Project | null>(null);
const isProjectLoading = ref<boolean>(false);
const projectErrorMessage = ref<string | null>(null);
const loadProject = async function(force = false) {
  isProjectLoading.value = true;
  projectErrorMessage.value = null;

  try {
    // we have to force a populate here because there's a race condition between
    // the populate that happens after a cover is uploaded and the projectStore.get()
    // here. So we need the await to guarantee that a force-populate has happened.
    // Not the best, but it'll work for now.
    await projectStore.populate(force);
    project.value = projectStore.get(projectId.value);
  } catch (err) {
    projectErrorMessage.value = err.message;
    router.push('/projects');
  } finally {
    isProjectLoading.value = false;
  }
};

const isUploadFormVisible = ref<boolean>(false);

const eventBus = useEventBus<{ project: Project }>('project:cover');
const handleRemoveCover = function(ev) {
  confirm.require({
    target: ev.currentTarget,
    message: 'Are you sure you want to remove your current cover?',
    acceptClass: '!bg-danger-500 dark:!bg-danger-400 !border-danger-500 dark:!border-danger-400 !ring-danger-500 dark:!ring-danger-400 hover:!bg-danger-600 dark:hover:!bg-danger-300 hover:!border-danger-600 dark:hover:!border-danger-300 focus:!ring-danger-400/50 dark:!focus:ring-danger-300/50',
    rejectClass: '!text-surface-500 dark:!text-surface-400',
    accept: async () => {
      const updatedProject = await deleteCover(project.value.id);
      eventBus.emit({ project: updatedProject });

      project.value = updatedProject;
    },
  });
};

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Projects', url: '/projects' },
    { label: project.value === null ? 'Loading...' : project.value.title, url: `/projects/${projectId.value}` },
    { label: project.value === null ? 'Loading...' : 'Edit', url: `/projects/${projectId.value}/edit` },
  ];
  return crumbs;
});

onMounted(() => loadProject());

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="project"
      class="flex flex-col justify-center max-w-screen-md"
    >
      <Panel
        :header="`Edit ${project.title}`"
        class="m-2"
      >
        <EditProjectForm
          :project="project"
          @form-success="router.push(`/projects/${project.id}`)"
          @form-cancel="router.push(`/projects/${project.id}`)"
        />
      </Panel>
      <Panel
        header="Upload a Cover"
        class="m-2"
      >
        <div class="max-h-48 max-w-32">
          <ProjectCover :project="project" />
        </div>
        <div class="flex items-center mt-4 gap-2">
          <Button
            label="Upload"
            size="large"
            :icon="PrimeIcons.UPLOAD"
            @click="isUploadFormVisible = true"
          />
          <Button
            v-if="project.cover"
            label="Remove"
            severity="danger"
            size="large"
            :icon="PrimeIcons.TRASH"
            @click="ev => handleRemoveCover(ev)"
          />
        </div>
        <Dialog
          v-model:visible="isUploadFormVisible"
          modal
        >
          <template #header>
            <h2 class="font-heading font-semibold uppercase">
              <span :class="PrimeIcons.UPLOAD" />
              Upload Cover
            </h2>
          </template>
          <UploadCoverForm
            :project="project"
            @project:cover="() => loadProject(true)"
            @form-success="isUploadFormVisible = false"
          />
        </Dialog>
      </Panel>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
