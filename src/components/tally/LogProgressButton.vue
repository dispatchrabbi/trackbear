<script setup lang="ts">
import { ref, computed } from 'vue';

import { useRoute } from 'vue-router';
const route = useRoute();
const relevantProjectId = computed(() => {
  if(route.name === 'project') {
    return +route.params.projectId;
  } else {
    return null;
  }
});

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { PrimeIcons } from 'primevue/api';

import CreateTallyForm from 'src/components/tally/CreateTallyForm.vue';

const isFormVisible = ref<boolean>(false);
const toggleForm = function() {
  isFormVisible.value = !isFormVisible.value;
};

</script>

<template>
  <Button
    v-tooltip="'Enter Progress'"
    :icon="PrimeIcons.CALENDAR_PLUS"
    size="large"
    rounded
    raised
    aria-label="Enter Progress"
    :pt="{ root: { class: 'text-xl !h-12 !w-12' } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
    @click="toggleForm"
  />
  <Dialog
    v-model:visible="isFormVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span class="pi pi-calendar-plus" />
        Add Progress
      </h2>
    </template>
    <CreateTallyForm
      :initial-work-id="relevantProjectId"
      @form-success="isFormVisible = false"
    />
  </Dialog>
</template>

<style scoped>
</style>
