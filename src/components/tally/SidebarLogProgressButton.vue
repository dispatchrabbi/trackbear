<script setup lang="ts">
import { ref, computed } from 'vue';

import { useRoute } from 'vue-router';
const route = useRoute();
const relevantWorkId = computed(() => {
  if(route.name === 'work') {
    return +route.params.workId;
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
}

</script>

<template>
  <Button
    class="w-full"
    size="large"
    :icon="PrimeIcons.CALENDAR_PLUS"
    raised
    label="Enter Progress"
    aria-label="Enter Progress"
    :pt="{ root: { class: ['items-baseline'] }, label: { class: ['flex-none' ] } }"
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
      :initial-work-id="relevantWorkId"
      @form-success="isFormVisible = false"
    />
  </Dialog>
</template>

<style scoped>
</style>
