<script setup lang="ts">
import { ref, computed } from 'vue';

import { useRoute } from 'vue-router';
const route = useRoute();
const relevantWorkId = computed(() => {
  if(route.name === 'work') {
    return +route.params.id;
  } else {
    return null;
  }
});

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import TallyForm from 'src/components/tally/TallyForm.vue';

const isFormVisible = ref<boolean>(false);
const toggleForm = function() {
  isFormVisible.value = !isFormVisible.value;
}

</script>

<template>
  <Button
    icon="pi pi-calendar-plus"
    size="large"
    rounded
    raised
    aria-label="Log Progress"
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
    <TallyForm
      :initial-work-id="relevantWorkId"
      @request-close="isFormVisible = false"
    />
  </Dialog>
</template>

<style scoped>
</style>
