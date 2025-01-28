<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();

import { deleteCover, type Work } from 'src/lib/api/work.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import EditWorkForm from 'src/components/work/EditWorkForm.vue';
import UploadCoverForm from 'src/components/work/UploadCoverForm.vue';
import WorkCover from 'src/components/work/WorkCover.vue';
import type { MenuItem } from 'primevue/menuitem';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { PrimeIcons } from 'primevue/api';

import { useConfirm } from "primevue/useconfirm";
const confirm = useConfirm();

const workId = ref<number>(+route.params.workId);
watch(() => route.params.workId, newId => {
  if(newId !== undefined) {
    workId.value = +newId;
    loadWork();
  }
});

const work = ref<Work | null>(null);
const isWorkLoading = ref<boolean>(false);
const workErrorMessage = ref<string | null>(null);
const loadWork = async function(force = false) {
  isWorkLoading.value = true;
  workErrorMessage.value = null;

  try {
    // we have to force a populate here because there's a race condition between
    // the populate that happens after a cover is uploaded and the workStore.get()
    // here. So we need the await to guarantee that a force-populate has happened.
    // Not the best, but it'll work for now.
    await workStore.populate(force);
    work.value = workStore.get(workId.value);
  } catch(err) {
    workErrorMessage.value = err.message;
    router.push('/works');
  } finally {
    isWorkLoading.value = false;
  }
}

const isUploadFormVisible = ref<boolean>(false);

const eventBus = useEventBus<{ work: Work }>('work:cover');
const handleRemoveCover = function(ev) {
  confirm.require({
    target: ev.currentTarget,
    message: 'Are you sure you want to remove your current cover?',
    acceptClass: '!bg-danger-500 dark:!bg-danger-400 !border-danger-500 dark:!border-danger-400 !ring-danger-500 dark:!ring-danger-400 hover:!bg-danger-600 dark:hover:!bg-danger-300 hover:!border-danger-600 dark:hover:!border-danger-300 focus:!ring-danger-400/50 dark:!focus:ring-danger-300/50',
    rejectClass: '!text-surface-500 dark:!text-surface-400',
    accept: async () => {
      const updatedWork = await deleteCover(work.value.id);
      eventBus.emit({ work: updatedWork });

      work.value = updatedWork;
    },
  })
};

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Projects', url: '/works' },
    { label: work.value === null ? 'Loading...' : work.value.title, url: `/works/${workId.value}` },
    { label: work.value === null ? 'Loading...' : 'Edit', url: `/works/${workId.value}/edit` },
  ];
  return crumbs;
});

onMounted(() => loadWork());

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="work"
      class="flex flex-col justify-center max-w-screen-md"
    >
      <Panel
        :header="`Edit ${work.title}`"
        class="m-2"
      >
        <EditWorkForm
          :work="work"
          @form-success="router.push(`/works/${work.id}`)"
          @form-cancel="router.push(`/works/${work.id}`)"
        />
      </Panel>
      <Panel
        header="Upload a Cover"
        class="m-2"
      >
        <div class="max-h-48 max-w-32">
          <WorkCover :work="work" />
        </div>
        <div class="flex items-center mt-4 gap-2">
          <Button
            label="Upload"
            size="large"
            :icon="PrimeIcons.UPLOAD"
            @click="isUploadFormVisible = true"
          />
          <Button
            v-if="work.cover"
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
            :work="work"
            @work:cover="() => loadWork(true)"
            @form-success="isUploadFormVisible = false"
          />
        </Dialog>
      </Panel>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
