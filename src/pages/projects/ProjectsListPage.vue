<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { RouterLink } from 'vue-router';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useProjectStore } from 'src/stores/project';
const projectStore = useProjectStore();

import { cmpByTitle, cmpByPhase, cmpByLastUpdate } from 'src/lib/project';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProjectTile from 'src/components/project/ProjectTile.vue';
import CreateProjectForm from 'src/components/project/CreateProjectForm.vue';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Projects', url: '/projects' },
];

const isCreateFormVisible = ref<boolean>(false);

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadProjects = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    await projectStore.populate();
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const PROJECT_SORTS = {
  'phase': { key: 'phase', label: 'Phase', cmpFn: cmpByPhase },
  'title': { key: 'title', label: 'Title', cmpFn: cmpByTitle },
  'last-updated': { key: 'last-updated', label: 'Last Updated', cmpFn: cmpByLastUpdate },
};

const projectsFilter = ref<string>('');
const projectsSort = useLocalStorage('projects-sort', 'phase');
const filteredProjects = computed(() => {
  const sortedProjects = projectStore.allProjects.toSorted(PROJECT_SORTS[projectsSort.value].cmpFn);
  const searchTerm = projectsFilter.value.toLowerCase();
  return sortedProjects.filter(project => project.title.toLowerCase().includes(searchTerm) || project.description.toLowerCase().includes(searchTerm));
});

onMounted(async () => {
  await userStore.populate();
  await loadProjects();
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="actions flex flex-wrap justify-end gap-2 mb-4">
      <div class="flex justify-end gap-2">
        <div>
          <Dropdown
            v-model="projectsSort"
            aria-label="Sort order"
            :options="Object.values(PROJECT_SORTS)"
            option-label="label"
            option-value="key"
          />
        </div>
        <div>
          <IconField>
            <InputIcon>
              <span :class="PrimeIcons.SEARCH" />
            </InputIcon>
            <InputText
              v-model="projectsFilter"
              class="w-full"
              placeholder="Type to filter..."
            />
          </IconField>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <div>
          <Button
            label="New"
            :icon="PrimeIcons.PLUS"
            @click="isCreateFormVisible = true"
          />
        </div>
        <div>
          <RouterLink
            :to="{ name: 'import-projects' }"
          >
            <Button
              label="Import"
              severity="help"
              :icon="PrimeIcons.FILE_IMPORT"
            />
          </RouterLink>
        </div>
      </div>
    </div>
    <div v-if="isLoading">
      Loading projects...
    </div>
    <div v-else-if="projectStore.allProjects.length === 0">
      You haven't made any projects yet. Click the <span class="font-bold">New</span> button to get started!
    </div>
    <div v-else-if="filteredProjects.length === 0">
      No matching projects found.
    </div>
    <div
      v-for="project in filteredProjects"
      v-else
      :key="project.id"
      class="mb-2"
    >
      <RouterLink :to="{ name: 'project', params: { projectId: project.id } }">
        <ProjectTile
          :project="project"
          :show-cover="userStore.user.userSettings.displayCovers"
        />
      </RouterLink>
    </div>
    <Dialog
      v-model:visible="isCreateFormVisible"
      modal
    >
      <template #header>
        <h2 class="font-heading font-semibold uppercase">
          <span :class="PrimeIcons.PLUS" />
          Create Project
        </h2>
      </template>
      <CreateProjectForm
        @form-success="isCreateFormVisible = false"
      />
    </Dialog>
  </ApplicationLayout>
</template>

<style scoped>
</style>
