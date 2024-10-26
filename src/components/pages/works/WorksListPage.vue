<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { RouterLink } from 'vue-router';

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();

import { getWorks, type SummarizedWork } from 'src/lib/api/work.ts';
import { cmpWorkByTitle, cmpWorkByPhase, cmpWorkByLastUpdate } from 'src/lib/work.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import WorkTile from 'src/components/work/WorkTile.vue';
import CreateWorkForm from 'src/components/work/CreateWorkForm.vue';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Projects', url: '/works' },
];

const isCreateFormVisible = ref<boolean>(false);

const works = ref<SummarizedWork[]>([]);
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
  workStore.populate(true);
  loadWorks();
}

const WORK_SORTS = {
  'phase': { key: 'phase', label: 'Phase', cmpFn: cmpWorkByPhase },
  'title': { key: 'title', label: 'Title', cmpFn: cmpWorkByTitle },
  'last-updated': { key: 'last-updated', label: 'Last Updated', cmpFn: cmpWorkByLastUpdate },
};

const worksFilter = ref<string>('');
const worksSort = useLocalStorage('works-sort', 'phase');
const filteredWorks = computed(() => {
  const sortedWorks = works.value.toSorted(WORK_SORTS[worksSort.value].cmpFn);
  const searchTerm = worksFilter.value.toLowerCase();
  return sortedWorks.filter(work => work.title.toLowerCase().includes(searchTerm) || work.description.toLowerCase().includes(searchTerm));
});

onMounted(async () => {
  await loadWorks();
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
            v-model="worksSort"
            aria-label="Sort order"
            :options="Object.values(WORK_SORTS)"
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
              v-model="worksFilter"
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
            :to="{ name: 'import-works' }"
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
    <div
      v-for="work in filteredWorks"
      :key="work.id"
      class="mb-2"
    >
      <RouterLink :to="{ name: 'work', params: { workId: work.id } }">
        <WorkTile
          :work="work"
          @work:star="reloadWorks()"
        />
      </RouterLink>
    </div>
    <div v-if="filteredWorks.length === 0 && works.length > 0">
      No matching projects found.
    </div>
    <div v-if="works.length === 0">
      You haven't made any projects yet. Click the <span class="font-bold">New</span> button to get started!
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
      <CreateWorkForm
        @work:create="reloadWorks()"
        @form-success="isCreateFormVisible = false"
      />
    </Dialog>
  </ApplicationLayout>
</template>

<style scoped>
</style>
